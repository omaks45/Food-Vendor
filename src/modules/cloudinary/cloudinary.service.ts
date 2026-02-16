/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    private readonly folder: string;

    constructor(private configService: ConfigService) {
        this.folder = this.configService.get('cloudinary.folder');
    }

    async uploadImage(
        file: Express.Multer.File,
        subfolder?: string,
    ): Promise<UploadApiResponse> {
        const uploadFolder = subfolder ? `${this.folder}/${subfolder}` : this.folder;

        return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            file.path,
            {
            folder: uploadFolder,
            transformation: [
                { width: 1200, height: 900, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
            ],
            },
            (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
                this.logger.error('Cloudinary upload failed', error);
                return reject(error);
            }
            resolve(result);
            },
        );
        });
    }

    async deleteImage(publicId: string): Promise<boolean> {
        try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
        } catch (error) {
        this.logger.error('Cloudinary delete failed', error);
        return false;
        }
    }

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
}