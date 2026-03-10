import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

/**
 * Migration: TalentIntelligenceSchema (1740000000000)
 * 
 * This migration establishes the core relational schema for the 
 * Talent Intelligence Service, including professional talent profiles, 
 * secure attachments, and intelligence assessments.
 */
export class TalentIntelligenceSchema1740000000000
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Establish the 'organizations' table (Multi-tenant isolation boundary)
        await queryRunner.createTable(
            new Table({
                name: 'organizations',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '64',
                        isPrimary: true,
                    },
                    {
                        name: 'display_name',
                        type: 'varchar',
                        length: '120',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
        );

        // 2. Establish the 'talent_profiles' table
        await queryRunner.createTable(
            new Table({
                name: 'talent_profiles',
                columns: [
                    {
                        name: 'profile_id',
                        type: 'varchar',
                        length: '64',
                        isPrimary: true,
                    },
                    {
                        name: 'org_id',
                        type: 'varchar',
                        length: '64',
                        isPrimary: true,
                    },
                    {
                        name: 'full_name',
                        type: 'varchar',
                        length: '160',
                        isNullable: true,
                    },
                    {
                        name: 'email_address',
                        type: 'varchar',
                        length: '160',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
        );

        await queryRunner.createForeignKey(
            'talent_profiles',
            new TableForeignKey({
                name: 'fk_talent_profiles_organization',
                columnNames: ['org_id'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // 3. Establish the 'profile_attachments' table
        await queryRunner.createTable(
            new Table({
                name: 'profile_attachments',
                columns: [
                    {
                        name: 'attachment_id',
                        type: 'varchar',
                        length: '64',
                        isPrimary: true,
                    },
                    {
                        name: 'profile_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'org_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'filename',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'storage_ref',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'content_blob',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'uploaded_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
        );

        await queryRunner.createForeignKey(
            'profile_attachments',
            new TableForeignKey({
                name: 'fk_profile_attachments_profile',
                columnNames: ['profile_id', 'org_id'],
                referencedTableName: 'talent_profiles',
                referencedColumnNames: ['profile_id', 'org_id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'profile_attachments',
            new TableIndex({
                name: 'idx_profile_attachments_on_profile',
                columnNames: ['profile_id', 'org_id'],
            }),
        );

        // 4. Establish the 'talent_assessments' table
        await queryRunner.createTable(
            new Table({
                name: 'talent_assessments',
                columns: [
                    {
                        name: 'assessment_id',
                        type: 'varchar',
                        length: '64',
                        isPrimary: true,
                    },
                    {
                        name: 'profile_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'org_id',
                        type: 'varchar',
                        length: '64',
                        isNullable: false,
                    },
                    {
                        name: 'assessment_status',
                        type: 'varchar',
                        length: '20',
                        isNullable: false,
                    },
                    {
                        name: 'integrity_score',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'key_strengths',
                        type: 'text',
                        isArray: true,
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'risk_factors',
                        type: 'text',
                        isArray: true,
                        default: "'{}'",
                        isNullable: false,
                    },
                    {
                        name: 'full_narrative',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'outcome_recommendation',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'engine_provider',
                        type: 'varchar',
                        length: '80',
                        isNullable: false,
                    },
                    {
                        name: 'runtime_version',
                        type: 'varchar',
                        length: '80',
                        isNullable: false,
                    },
                    {
                        name: 'failure_log',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
        );

        await queryRunner.createForeignKey(
            'talent_assessments',
            new TableForeignKey({
                name: 'fk_talent_assessments_profile',
                columnNames: ['profile_id', 'org_id'],
                referencedTableName: 'talent_profiles',
                referencedColumnNames: ['profile_id', 'org_id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'talent_assessments',
            new TableIndex({
                name: 'idx_talent_assessments_on_profile',
                columnNames: ['profile_id', 'org_id'],
            }),
        );

        await queryRunner.createIndex(
            'talent_assessments',
            new TableIndex({
                name: 'idx_talent_assessments_status',
                columnNames: ['assessment_status'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'talent_assessments',
            'idx_talent_assessments_status',
        );
        await queryRunner.dropIndex(
            'talent_assessments',
            'idx_talent_assessments_on_profile',
        );
        await queryRunner.dropForeignKey(
            'talent_assessments',
            'fk_talent_assessments_profile',
        );
        await queryRunner.dropTable('talent_assessments');

        await queryRunner.dropIndex(
            'profile_attachments',
            'idx_profile_attachments_on_profile',
        );
        await queryRunner.dropForeignKey(
            'profile_attachments',
            'fk_profile_attachments_profile',
        );
        await queryRunner.dropTable('profile_attachments');

        await queryRunner.dropForeignKey(
            'talent_profiles',
            'fk_talent_profiles_organization',
        );
        await queryRunner.dropTable('talent_profiles');

        await queryRunner.dropTable('organizations');
    }
}
