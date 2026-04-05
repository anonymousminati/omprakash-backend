import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_USERNAME || "omprakash-portal";
const BUNNY_ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY || "";
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "https://omprakash-portal-cdn.b-cdn.net";

// Determine region from hostname. default to Singapore based on env file
const hostname = process.env.BUNNY_STORAGE_HOSTNAME || "sg.storage.bunnycdn.com";
let region = "sg";
if (hostname.startsWith("fs")) region = "fs";
else if (hostname.startsWith("ny")) region = "ny";
else if (hostname.startsWith("la")) region = "la";
else if (hostname.startsWith("sg")) region = "sg";
else if (hostname.startsWith("syd")) region = "syd";

// Connect to Bunny Storage
const storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
    region as BunnyStorageSDK.regions.StorageRegion,
    BUNNY_STORAGE_ZONE,
    BUNNY_ACCESS_KEY
);

/**
 * Uploads an image buffer to Bunny.net storage after optimizing it to WebP.
 * @param fileBuffer The raw image buffer from Multer.
 * @param category The storage category (e.g., 'complaints', 'gallery', 'profile').
 * @returns The unique relative path / CDN path of the uploaded image.
 */
export async function uploadImage(fileBuffer: Buffer, category: 'complaints' | 'gallery' | 'profile' | 'posts'): Promise<string> {
    const fileName = `${uuidv4()}.webp`;
    const uploadPath = `${category}/${fileName}`;

    // Convert to WebP using Sharp
    const webpBuffer = await sharp(fileBuffer)
        .webp({ quality: 80 }) // Optimize quality/size
        .toBuffer();

    // Upload to Bunny
    await BunnyStorageSDK.file.upload(storageZone, uploadPath, webpBuffer as any);

    return uploadPath;
}

/**
 * Deletes an image from Bunny.net storage.
 * @param imagePath The relative path of the image (e.g., 'complaint/123.webp').
 */
export async function deleteImage(imagePath: string): Promise<void> {
    await BunnyStorageSDK.file.remove(storageZone, imagePath);
}

/**
 * Helper to get the full CDN URL for a given relative path.
 * @param relativePath The path saved in the database (e.g., 'complaint/123.webp').
 */
export function getFullCdnUrl(relativePath: string): string {
    // If it's already a full URL, return it
    if (relativePath.startsWith('http')) {
        return relativePath;
    }
    const baseUrl = BUNNY_CDN_URL.endsWith('/') ? BUNNY_CDN_URL.slice(0, -1) : BUNNY_CDN_URL;
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${baseUrl}${path}`;
}
