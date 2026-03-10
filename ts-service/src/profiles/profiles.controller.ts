import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { TalentProfile } from '../entities/talent-profile.entity';
import { RegisterTalentProfileDto } from './dto/register-talent-profile.dto';
import { ProfilesService } from './profiles.service';

/**
 * ProfilesController serves as the primary gateway for interacting with
 * professional talent profile records.
 */
@Controller('profiles')
@UseGuards(FakeAuthGuard)
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    /**
     * Registers a new professional profile within the organization.
     * 
     * @param user - Authenticated user context.
     * @param dto - Data defining the new profile.
     */
    @Post()
    async registerProfile(
        @CurrentUser() user: AuthUser,
        @Body() dto: RegisterTalentProfileDto,
    ): Promise<TalentProfile> {
        return this.profilesService.registerProfile(user, dto);
    }

    /**
     * Retrieves a comprehensive list of all professional profiles associated
     * with the current organization.
     */
    @Get()
    async listProfiles(@CurrentUser() user: AuthUser): Promise<TalentProfile[]> {
        return this.profilesService.listProfilesForOrganization(user);
    }
}
