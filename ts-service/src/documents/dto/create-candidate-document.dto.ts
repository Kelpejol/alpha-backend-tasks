import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCandidateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
