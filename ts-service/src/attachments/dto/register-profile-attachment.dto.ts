import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * RegisterProfileAttachmentDto defines the required payload for successfully
 * attaching a document to a talent profile.
 */
export class RegisterProfileAttachmentDto {
  /**
   * Functional category of the document (e.g., 'resume', 'cover_letter').
   */
  @IsString({ message: 'Attachment type must be a valid string' })
  @IsNotEmpty({ message: 'Attachment type is a required field' })
  @MaxLength(64)
  attachmentType!: string;

  /**
   * Original human-readable name of the uploaded file.
   */
  @IsString({ message: 'Original filename must be a valid string' })
  @IsNotEmpty({ message: 'Original filename is a required field' })
  @MaxLength(255)
  originalName!: string;

  /**
   * Unique reference key used by the storage abstraction layer.
   */
  @IsString({ message: 'Storage reference must be a valid string' })
  @IsNotEmpty({ message: 'Storage reference is a required field' })
  @MaxLength(500)
  storageReference!: string;

  /**
   * Unstructured text content extracted from the document for processing.
   */
  @IsString({ message: 'Content blob must be a valid string' })
  @IsNotEmpty({ message: 'Content blob is a required field' })
  contentBlob!: string;
}
