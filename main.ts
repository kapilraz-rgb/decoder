// ====================================================================
// SETTINGS DECODER SUITE EXTENSION (STABLE RAW HEADER BUFFER PROD RELEASE)
// ====================================================================

//% color="#e91e63" icon="\uf1de" block="Settings Decoder"
namespace settingsDecoder {

    // ==========================================
    // 1. IMAGE SUITE (OVAL IMAGE TYPE REPORTERS)
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
     * Decode an image asset from a text string registry record (Oval Variable Type)
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
    // 2. LOCATION SUITE (OVAL LOCATION TYPE REPORTERS)
    // ==========================================

    /**
     * Save a tile location's column and row coordinates directly to memory
     */
    //% blockId="sd_save_tile_location"
    //% block="save tile location $loc to slot $name"
    //% loc.shadow=maplocationidentity
    //% weight=90
    export function saveTileLocation(loc: tiles.Location, name: string): void {
        if (!loc) return;
        let serialized = loc.col + "," + loc.row + ",";
        settings.writeString("LOC_TILE_" + name, serialized);
    }

    /**
     * Decode a saved location from a record slot as a native tile location object (Oval Variable Type)
     */
    //% blockId="sd_decode_tile_location"
    //% block="decode location from slot $name"
    //% weight=85
    export function decodeTileLocation(name: string): tiles.Location {
        let rawData = settings.readString("LOC_TILE_" + name);
        if (!rawData) return tiles.getTileLocation(0, 0);

        let commaIndex = rawData.indexOf(",");
        if (commaIndex < 0) return tiles.getTileLocation(0, 0);

        let colStr = rawData.substr(0, commaIndex);
        let rowStr = rawData.substr(commaIndex + 1, rawData.length - (commaIndex + 1));

        let col = parseInt(colStr);
        let row = parseInt(rowStr);

        return tiles.getTileLocation(col, row);
    }

    // ==========================================
    // 3. TILEMAP SUITE (OVAL TILEMAP DATA TYPE REPORTERS)
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
        settings.writeString("TM_DATA_" + name, serializedData);
    }

    /**
     * Reconstruct a saved tilemap string layout into a native operational TileMapData variable (Oval Variable Type)
     */
    //% blockId="sd_decode_tilemap"
    //% block="decode tilemap data from slot $name"
    //% weight=75
    export function decodeTilemap(name: string): tiles.TileMapData {
        let rawData = settings.readString("TM_DATA_" + name);
        if (!rawData) return null;

        let commaIndex1 = rawData.indexOf(",");
        if (commaIndex1 < 0) return null;
        let wStr = rawData.substr(0, commaIndex1);
        let w = parseInt(wStr);

        let remaining = rawData.substr(commaIndex1 + 1, rawData.length - (commaIndex1 + 1));
        let commaIndex2 = remaining.indexOf(",");
        if (commaIndex2 < 0) return null;
        let hStr = remaining.substr(0, commaIndex2);
        let h = parseInt(hStr);

        let pixelsStr = remaining.substr(commaIndex2 + 1, remaining.length - (commaIndex2 + 1));

        // FIXED: Allocate an official 4-byte header buffer wrapper structure
        let buf = control.createBuffer(4 + (w * h));
        buf.setNumber(NumberFormat.UInt16LE, 0, w);
        buf.setNumber(NumberFormat.UInt16LE, 2, h);

        let index = 0;
        while (pixelsStr.length > 0) {
            let nextComma = pixelsStr.indexOf(",");
            if (nextComma < 0) break;
            let valStr = pixelsStr.substr(0, nextComma);
            let val = parseInt(valStr);

            // Inject tiles directly into the safe buffer data positions (Offsetting by 4 header bytes)
            if ((4 + index) < buf.length) {
                buf.setNumber(NumberFormat.UInt8LE, 4 + index, val);
            }
            index++;

            pixelsStr = pixelsStr.substr(nextComma + 1, pixelsStr.length - (nextComma + 1));
        }

        // FIXED: Assemble using the correct 4-argument structured framework engine layout
        let canvasLayer = image.create(w, h);
        let emptyTileset: Image[] = [];
        return tiles.createTilemap(buf, canvasLayer, emptyTileset, 4);
    }

    // ==========================================
    // 4. STORAGE UTILITIES & CHECKS
    // ==========================================

    /**
     * Check if a specific data record key exists anywhere in the system memory
     */
    //% blockId="sd_record_exists"
    //% block="saved record $name exists"
    //% weight=65
    export function recordExists(name: string): boolean {
        if (settings.exists("TM_DATA_" + name)) return true;
        if (settings.exists("LOC_TILE_" + name)) return true;
        if (settings.exists("IMG_" + name)) return true;
        return false;
    }

    /**
     * Clear specific memory profiles tied to tag target names
     */
    //% blockId="sd_clear_record"
    //% block="clear saved record data $name"
    //% weight=60
    export function clearRecord(name: string): void {
        settings.remove("TM_DATA_" + name);
        settings.remove("LOC_TILE_" + name);
        settings.remove("IMG_" + name);
    }

    /**
     * Reset complete system registry layout configuration entries
     */
    //% blockId="sd_clear_all"
    //% block="clear all encoded assets"
    //% weight=55
    export function clearAll(): void {
        let tmKeys = settings.list("TM_DATA_");
        for (let k of tmKeys) settings.remove(k);
        let imgKeys = settings.list("IMG_");
        for (let k of imgKeys) settings.remove(k);
        let locKeys = settings.list("LOC_TILE_");
        for (let k of locKeys) settings.remove(k);
    }
}
