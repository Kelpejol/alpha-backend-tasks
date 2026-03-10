import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * RegisterTalentProfileDto defines the input schema for successfully
 * registering a professional talent profile in the system.
 */
export class RegisterTalentProfileDto {
    /**
     * Complete legal or professional name of the individual.
     */
    @IsString({ message: 'Profile name must be a valid string' })
    @IsNotEmpty({ message: 'Profile name is a required field' })
    @MaxLength(160)
    fullName!: string;

    /**
     * Primary contact email address for the talent.
     */
    @IsOptional()
    @IsEmail({}, { message: 'Primary email must be a valid email address' })
    @MaxLength(160)
    emailAddress?: string;
}
