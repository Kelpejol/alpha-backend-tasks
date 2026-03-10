import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';

describe('Talent Intelligence Service (E2E)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Reproduce global main.ts configuration
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalFilters(new ApiExceptionFilter());

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    const authHeaders = {
        'x-user-id': 'admin-test-01',
        'x-workspace-id': 'org-test-99',
    };

    describe('Talent Lifecycle Workflow', () => {
        let candidateId: string;

        it('Registers a new talent profile', async () => {
            const response = await request(app.getHttpServer())
                .post('/profiles')
                .set(authHeaders)
                .send({
                    fullName: 'Marie Curie',
                    emailAddress: 'marie@science.org',
                })
                .expect(201);

            expect(response.body).toHaveProperty('profileId');
            expect(response.body.fullName).toBe('Marie Curie');
            candidateId = response.body.profileId;
        });

        it('Uploads a document for the candidate', async () => {
            await request(app.getHttpServer())
                .post(`/candidates/${candidateId}/documents`)
                .set(authHeaders)
                .send({
                    attachmentType: 'resume',
                    originalName: 'cv_v1.pdf',
                    storageReference: 'local://profiles/marie/cv_v1.txt',
                    contentBlob: 'Chemistry and Physics pioneer with two Nobel prizes.',
                })
                .expect(201);
        });

        it('Triggers an asynchronous intelligence summary', async () => {
            const response = await request(app.getHttpServer())
                .post(`/candidates/${candidateId}/summaries/generate`)
                .set(authHeaders)
                .send({
                    runtimeVersion: 'v2-quantum',
                })
                .expect(202);

            expect(response.body).toHaveProperty('summaryId');
            expect(response.body.status).toBe('pending');
            expect(response.body).toHaveProperty('jobId');
        });

        it('Retrieves the list of summaries for the candidate', async () => {
            const response = await request(app.getHttpServer())
                .get(`/candidates/${candidateId}/summaries`)
                .set(authHeaders)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Access Control & Validation Boundary', () => {
        it('Blocks access from a different organization', async () => {
            const rogueHeaders = {
                'x-user-id': 'rogue-actor',
                'x-workspace-id': 'org-wrong-10',
            };

            // Attempting to list candidates in an org where none exist (or access Marie Curie)
            const response = await request(app.getHttpServer())
                .get('/profiles')
                .set(rogueHeaders)
                .expect(200);

            expect(response.body.length).toBe(0);
        });

        it('Returns a standardized 422 error on malformed input', async () => {
            const response = await request(app.getHttpServer())
                .post('/profiles')
                .set(authHeaders)
                .send({
                    // Missing fullName
                    emailAddress: 'invalid'
                })
                .expect(422);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toHaveProperty('details');
        });
    });
});
