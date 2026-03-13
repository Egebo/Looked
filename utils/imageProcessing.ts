import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Crops an image based on normalized bounding box coordinates.
 * @param imageUri - The URI of the original image.
 * @param bbox - Array [ymin, xmin, ymax, xmax] normalized (0-1).
 * @param width - Original image width (optional, will be fetched if not provided).
 * @param height - Original image height (optional, will be fetched if not provided).
 */
export const cropImage = async (
    imageUri: string,
    bbox: [number, number, number, number], // Can be 0-1 scale or 0-1000
    originalWidth?: number,
    originalHeight?: number,
    category?: string,
    isAutoTrimmed?: boolean
): Promise<string> => {
    let width = originalWidth;
    let height = originalHeight;

    // If dimensions are missing, get them (this might be slow, ideally pass them)
    if (!width || !height) {
        // We can't easily get dimensions without another lib efficiently, 
        // so we assume the caller passes them or we rely on ImageManipulator handling percentage if possible.
        // Sadly ImageManipulator crop takes pixels.
        // For now, we will assume standard camera aspect ratio if missing or try to infer.
        // BETTER: The caller (Scan Screen) should get dimensions from the picked asset.
        throw new Error("Original image dimensions required for cropping.");
    }

    const [ymin, xmin, ymax, xmax] = bbox;

    // Apply an intentional 15% safe zone padding (bol kesim).
    // Reduced from 30% because AI coordinates are now strictly clamped by anatomical rules.
    const PADDING = 0.15;
    const boxWidth = xmax - xmin;
    const boxHeight = ymax - ymin;

    const paddedXmin = Math.max(0, xmin - (boxWidth * PADDING));
    const paddedYmin = Math.max(0, ymin - (boxHeight * PADDING));
    const paddedXmax = Math.min(1, xmax + (boxWidth * PADDING));
    const paddedYmax = Math.min(1, ymax + (boxHeight * PADDING));

    const cropX = Math.round(paddedXmin * width);
    const cropY = Math.round(paddedYmin * height);
    const cropWidth = Math.round((paddedXmax - paddedXmin) * width);
    const cropHeight = Math.round((paddedYmax - paddedYmin) * height);

    // Ensure we don't go out of bounds (redundant but safe)
    const safeX = Math.max(0, cropX);
    const safeY = Math.max(0, cropY);
    const safeWidth = Math.min(cropWidth, width - safeX);
    const safeHeight = Math.min(cropHeight, height - safeY);

    if (safeWidth <= 0 || safeHeight <= 0) {
        console.warn("Invalid crop dimensions", { safeX, safeY, safeWidth, safeHeight });
        return imageUri; // Return original if crop fails
    }

    try {
        const result = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ crop: { originX: safeX, originY: safeY, width: safeWidth, height: safeHeight } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.PNG }
        );
        return result.uri;
    } catch (error) {
        console.error("Error manipulating image:", error);
        return imageUri; // Return original URI on error
    }
};
