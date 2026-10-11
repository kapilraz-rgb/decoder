// ====================================================================
// SETTINGS DECODER SUITE EXTENSION (STABLE COMPLETE RELEASE)
// ====================================================================

//% color="#e91e63" icon="\uf1de" block="Settings Decoder"
namespace settingsDecoder {

    // ==========================================
    // 1. IMAGE ENCODERS & DECODERS
    // ==========================================

    /**
     * Encode an image asset into a text string registry record
     */
    //% blockId="sd_encode_image"
    //% block="encode image $img=screen as record $name"
    //% weight=100
    export function encodeImage(img: Image, name: string): void {
        if (!img) return;
        let w = img.width;
        let h = img.height;
        let serialized = w + "," + h + ",";
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                serialized += img.getPixel(x, y) + ",";
            }
        }
        settings.writeString("IMG_" + name, serialized);
    }

    /**
     * Decode an image asset from a text string registry record
     */
    //% blockId="sd_decode_image"
    //% block="decode image from record $name"
    //% weight=90
    export function decodeImage(name: string): Image {
        let rawData = settings.readString("IMG_" + name);
        if (!rawData) return image.create(16, 16);

        let commaIndex1 = rawData.indexOf(",");
        if (commaIndex1 < 0) return image.create(16, 16);
        let wStr = rawData.substr(0, commaIndex1);
        let w = parseInt(wStr);

        let remaining = rawData.substr(commaIndex1 + 1, rawData.length - (commaIndex1 + 1));
        let commaIndex2 = remaining.indexOf(",");
        if (commaIndex2 < 0) return image.create(w, 16);
        let hStr = remaining.substr(0, commaIndex2);
        let h = parseInt(hStr);

        let img = image.create(w, h);
        let pixelsStr = remaining.substr(commaIndex2 + 1, remaining.length - (commaIndex2 + 1));

        let x = 0;
        let y = 0;
        while (pixelsStr.length > 0) {
            let nextComma = pixelsStr.indexOf(",");
            if (nextComma < 0) break;
            let valStr = pixelsStr.substr(0, nextComma);
            let val = parseInt(valStr);
            img.setPixel(x, y, val);

            x++;
            if (x >= w) {
                x = 0;
                y++;
                if (y >= h) break;
            }
            pixelsStr = pixelsStr.substr(nextComma + 1, pixelsStr.length - (nextComma + 1));
        }
        return img;
    }

    // ==========================================
    // 2. LOCATION / COORDINATE ENCODERS & DECODERS
    // ==========================================

    /**
     * Save specific X and Y positions straight to flash storage memory
     */
    //% blockId="sd_save_coordinate"
    //% block="save position x $x y $y as $name"
    //% weight=80
    export function saveCoordinate(x: number, y: number, name: string): void {
        let serialized = x + "," + y + ",";
        settings.writeString("LOC_" + name, serialized);
    }

    /**
     * Read saved coordinate data as a plain text string
     */
    //% blockId="sd_decode_coordinates_str"
    //% block="get raw coordinate string $name"
    //% weight=70
    export function decodeCoordinatesStr(name: string): string {
        let rawData = settings.readString("LOC_" + name);
        if (!rawData) return "";
        return rawData;
    }

    // ==========================================
    // 3. TILEMAP ENCODERS & DECODERS
    // ==========================================

    /**
     * Encode a raw layer image layout out into flash registry settings strings
     */
    //% blockId="sd_encode_tilemap"
    //% block="encode tilemap image data $tmMap=screen as $name"
    //% weight=60
    export function encodeTilemapImage(tmMap: Image, name: string): void {
        if (!tmMap) return;
        let w = tmMap.width;
        let h = tmMap.height;
        let serializedData = w + "," + h + ",";

        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                let tileIndex = tmMap.getPixel(col, row);
                serializedData += tileIndex + ",";
            }
        }
        settings.writeString("TM_" + name, serializedData);
    }

    /**
     * Decode tilemap strings back into a clean Image canvas structure format
     */
    //% blockId="sd_decode_tilemap"
    //% block="decode tilemap image from record $name"
    //% weight=50
    export function decodeTilemapImage(name: string): Image {
        let rawData = settings.readString("TM_" + name);
        if (!rawData) return image.create(16, 16);

        let commaIndex1 = rawData.indexOf(",");
        if (commaIndex1 < 0) return image.create(16, 16);
        let wStr = rawData.substr(0, commaIndex1);
        let w = parseInt(wStr);

        let remaining = rawData.substr(commaIndex1 + 1, rawData.length - (commaIndex1 + 1));
        let commaIndex2 = remaining.indexOf(",");
        if (commaIndex2 < 0) return image.create(w, 16);
        let hStr = remaining.substr(0, commaIndex2);
        let h = parseInt(hStr);

        let layersImage = image.create(w, h);
        let pixelsStr = remaining.substr(commaIndex2 + 1, remaining.length - (commaIndex2 + 1));

        let col = 0;
        let row = 0;
        while (pixelsStr.length > 0) {
            let nextComma = pixelsStr.indexOf(",");
            if (nextComma < 0) break;
            let valStr = pixelsStr.substr(0, nextComma);
            let val = parseInt(valStr);
            layersImage.setPixel(col, row, val);

            col++;
            if (col >= w) {
                col = 0;
                row++;
                if (row >= h) break;
            }
            pixelsStr = pixelsStr.substr(nextComma + 1, pixelsStr.length - (nextComma + 1));
        }
        return layersImage;
    }

    // ==========================================
    // 4. GENERAL SYSTEM MEMORY MANAGEMENT
    // ==========================================

    /**
     * Clear specific memory profiles tied to tag target names
     */
    //% blockId="sd_clear_encode"
    //% block="clear encode data $name"
    //% weight=40
    export function clearEncode(name: string): void {
        settings.remove("TM_" + name);
        settings.remove("IMG_" + name);
        settings.remove("LOC_" + name);
    }

    /**
     * Reset complete system registry layout configuration entries
     */
    //% blockId="sd_clear_all"
    //% block="clear all encoded assets"
    //% weight=30
    export function clearAll(): void {
        let tmKeys = settings.list("TM_");
        for (let k of tmKeys) settings.remove(k);
        let imgKeys = settings.list("IMG_");
        for (let k of imgKeys) settings.remove(k);
        let locKeys = settings.list("LOC_");
        for (let k of locKeys) settings.remove(k);
    }
}

