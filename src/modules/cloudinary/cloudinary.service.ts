/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    private readonly folder: string;

    constructor(private configService: ConfigService) {
        // Configure Cloudinary credentials
        cloudinary.config({
        cloud_name: this.configService.get<string>('cloudinary.cloudName'),
        api_key: this.configService.get<string>('cloudinary.apiKey'),
        api_secret: this.configService.get<string>('cloudinary.apiSecret'),
        });

        this.folder = this.configService.get<string>('cloudinary.folder');
        this.logger.log('✅ Cloudinary configured successfully');
    }

    // ---------------------------------------------------------------------------
    // PUBLIC: Upload
    // ---------------------------------------------------------------------------

    /**
     * Upload a single image to Cloudinary.
     * Uses upload_stream (buffer-based) — works with memory storage (no temp files).
     */
    async uploadImage(
        file: Express.Multer.File,
        subfolder?: string,
    ): Promise<UploadApiResponse> {
        const folder = this.resolveFolder(subfolder);

        return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
            folder,
            resource_type: 'image',
            transformation: this.defaultTransformation(),
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
                this.logger.error('Cloudinary upload failed', error);
                return reject(error);
            }

            if (!result) {
                return reject(new Error('Upload failed without error'));
            }

            this.logger.log(`Image uploaded: ${result.public_id}`);
            resolve(result);
            },
        );

        stream.end(file.buffer);
        });
    }

    /**
     * Upload multiple images concurrently.
     */
    async uploadMultipleImages(
        files: Express.Multer.File[],
        subfolder?: string,
    ): Promise<UploadApiResponse[]> {
        return Promise.all(files.map((file) => this.uploadImage(file, subfolder)));
    }

    // ---------------------------------------------------------------------------
    // PUBLIC: Delete
    // ---------------------------------------------------------------------------

    /**
     * Delete a single image by public_id.
     * Throws on unexpected errors so callers can handle them.
     */
    async deleteImage(publicId: string): Promise<void> {
        try {
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            this.logger.log(`Image deleted: ${publicId}`);
        } else {
            this.logger.warn(`Failed to delete image: ${publicId} — ${result.result}`);
        }
        } catch (error) {
        this.logger.error(`Error deleting image ${publicId}:`, error.message);
        throw error;
        }
    }

    /**
     * Delete multiple images concurrently.
     */
    async deleteMultipleImages(publicIds: string[]): Promise<void> {
        await Promise.all(publicIds.map((id) => this.deleteImage(id)));
    }

    // ---------------------------------------------------------------------------
    // PUBLIC: URL Generation
    // ---------------------------------------------------------------------------

    /**
     * Generate an optimised URL for an already-uploaded image.
     * Width and height are optional — omitting both returns a quality/format
     * optimised URL at the original dimensions.
     */
    getOptimizedUrl(publicId: string, width?: number, height?: number): string {
        const transformation = [];

        if (width && height) {
        transformation.push({ width, height, crop: 'fill' });
        } else if (width) {
        transformation.push({ width, crop: 'scale' });
        }

        transformation.push({ quality: 'auto', fetch_format: 'auto' });

        return cloudinary.url(publicId, { transformation });
    }

    // ---------------------------------------------------------------------------
    // PRIVATE: Helpers
    // ---------------------------------------------------------------------------

    /**
     * Resolve the target folder, optionally appending a subfolder.
     */
    private resolveFolder(subfolder?: string): string {
        return subfolder ? `${this.folder}/${subfolder}` : this.folder;
    }

    /**
     * Shared upload transformation applied to all uploads.
     * Centralised here so any future change applies everywhere.
     */
    private defaultTransformation() {
        return [
        { width: 1200, height: 900, crop: 'limit' }, // preserve aspect ratio, cap dimensions
        { quality: 'auto:good' },                     // good balance of size vs quality
        { fetch_format: 'auto' },                     // serve WebP/AVIF where supported
        ];
    }
}