// ====================================================================
// SETTINGS DECODER SUITE EXTENSION (STABLE COMPLETE RELEASE)
// ====================================================================

//% color="#e91e63" icon="\uf1de" block="Settings Decoder"
namespace settingsDecoder {

    // ==========================================
    // 1. IMAGE SUITE
    // ==========================================

    /**
     * Encode an image asset into a text string registry record
     */
    //% blockId="sd_encode_image"
    //% block="encode image $img as record $name"
    //% img.shadow=screen_image_picker
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
    //% weight=95
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
    // 2. LOCATION SUITE
    // ==========================================

    /**
     * Save specific X and Y positions straight to flash storage memory
     */
    //% blockId="sd_save_coordinate"
    //% block="save position x $x y $y as $name"
    //% weight=90
    export function saveCoordinate(x: number, y: number, name: string): void {
        let serialized = x + "," + y + ",";
        settings.writeString("LOC_" + name, serialized);
    }

    /**
     * Teleport a target sprite straight to the coordinates stored inside a record profile
     */
    //% blockId="sd_decode_location"
    //% block="load position from record $name onto sprite $sprite"
    //% sprite.shadow=variables_get
    //% weight=85
    export function decodeLocation(name: string, sprite: Sprite): void {
        if (!sprite) return;
        let rawData = settings.readString("LOC_" + name);
        if (!rawData) return;

        let commaIndex = rawData.indexOf(",");
        if (commaIndex < 0) return;
        let xStr = rawData.substr(0, commaIndex);
        let yStr = rawData.substr(commaIndex + 1, rawData.length - (commaIndex + 1));

        let targetX = parseInt(xStr);
        let targetY = parseInt(yStr);

        sprite.setPosition(targetX, targetY);
    }

    // ==========================================
    // 3. TILEMAP SUITE
    // ==========================================

    /**
     * Automatically capture and save the active tilemap layout the player is currently inside
     */
    //% blockId="sd_encode_current_tilemap"
    //% block="encode current tilemap as $name"
    //% weight=80
    export function encodeCurrentTilemap(name: string): void {
        let scene = game.currentScene();
        if (!scene || !scene.tileMap || !scene.tileMap.data) return;

        let tilemapData = scene.tileMap.data;
        let w = tilemapData.width;
        let h = tilemapData.height;
        let serializedData = w + "," + h + ",";

        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                let tileVal = tilemapData.getTile(col, row);
                serializedData += tileVal + ",";
            }
        }
        settings.writeString("TM_" + name, serializedData);
    }

    /**
     * Load a saved tilemap structure template from memory and instantly force render it over the active scene
     */
    //% blockId="sd_decode_tilemap"
    //% block="load and draw tilemap from record $name"
    //% weight=75
    export function decodeTilemap(name: string): void {
        let rawData = settings.readString("TM_" + name);
        if (!rawData) return;

        let commaIndex1 = rawData.indexOf(",");
        if (commaIndex1 < 0) return;
        let wStr = rawData.substr(0, commaIndex1);
        let w = parseInt(wStr);

        let remaining = rawData.substr(commaIndex1 + 1, rawData.length - (commaIndex1 + 1));
        let commaIndex2 = remaining.indexOf(",");
        if (commaIndex2 < 0) return;
        let hStr = remaining.substr(0, commaIndex2);
        let h = parseInt(hStr);

        let pixelsStr = remaining.substr(commaIndex2 + 1, remaining.length - (commaIndex2 + 1));

        let scene = game.currentScene();
        if (!scene || !scene.tileMap || !scene.tileMap.data) return;

        let col = 0;
        let row = 0;
        while (pixelsStr.length > 0) {
            let nextComma = pixelsStr.indexOf(",");
            if (nextComma < 0) break;
            let valStr = pixelsStr.substr(0, nextComma);
            let val = parseInt(valStr);

            scene.tileMap.data.setTile(col, row, val);

            col++;
            if (col >= w) {
                col = 0;
                row++;
                if (row >= h) break;
            }
            pixelsStr = pixelsStr.substr(nextComma + 1, pixelsStr.length - (nextComma + 1));
        }

        // FIXED: Using the proper runtime tilemap reset trigger
        scene.tileMap.setData(scene.tileMap.data);
    }

    // ==========================================
    // 4. SYSTEM UTILITIES
    // ==========================================

    /**
     * Check if a specific save record key exists anywhere in the system memory
     */
    //% blockId="sd_encode_exists"
    //% block="saved data record $name exists"
    //% weight=60
    export function encodeExists(name: string): boolean {
        if (settings.exists("TM_" + name)) return true;
        if (settings.exists("IMG_" + name)) return true;
        if (settings.exists("LOC_" + name)) return true;
        return false;
    }

    /**
     * Clear specific memory profiles tied to tag target names
     */
    //% blockId="sd_clear_encode"
    //% block="clear encode data $name"
    //% weight=50
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
    //% weight=40
    export function clearAll(): void {
        let tmKeys = settings.list("TM_");
        for (let k of tmKeys) settings.remove(k);
        let imgKeys = settings.list("IMG_");
        for (let k of imgKeys) settings.remove(k);
        let locKeys = settings.list("LOC_");
        for (let k of locKeys) settings.remove(k);
    }
}
