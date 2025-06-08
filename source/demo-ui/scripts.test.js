const $ = require('jquery');

/**
 * @jest-environment jsdom
 */

global.$ = $;

// Mock appVariables
global.appVariables = { apiEndpoint: 'https://api.example.com' };

// Import functions to test
// Since the code is not in a module, we need to redefine the functions here for testing
// Alternatively, you can refactor your code to export the functions for easier testing

// --- Copied functions for testability ---
function hexToRgbA(hex, _alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return { r: ((c >> 16) & 255), g: ((c >> 8) & 255), b: (c & 255), alpha: Number(_alpha) };
    }
    throw new Error('Bad Hex');
}

function handleResize(_width, _edits, _height, _resize) {
    if (_width !== "") { _edits.resize.width = Number(_width); }
    if (_height !== "") { _edits.resize.height = Number(_height); }
    _edits.resize.fit = _resize;
}

function handleSmartCrop(_edits, _smartCropIndex, _smartCropPadding) {
    _edits.smartCrop = {};
    if (_smartCropIndex !== "") { _edits.smartCrop.faceIndex = Number(_smartCropIndex); }
    if (_smartCropPadding !== "") { _edits.smartCrop.padding = Number(_smartCropPadding); }
}

// --- End copied functions ---

describe('hexToRgbA', () => {
    it('converts 6-digit hex to rgba', () => {
        expect(hexToRgbA('#ff00cc', 0.5)).toEqual({ r: 255, g: 0, b: 204, alpha: 0.5 });
    });

    it('converts 3-digit hex to rgba', () => {
        expect(hexToRgbA('#abc', 1)).toEqual({ r: 170, g: 187, b: 204, alpha: 1 });
    });

    it('throws on bad hex', () => {
        expect(() => hexToRgbA('badhex', 1)).toThrow('Bad Hex');
    });
});

describe('handleResize', () => {
    it('sets width, height, and fit when all provided', () => {
        const edits = { resize: {} };
        handleResize('100', edits, '200', 'cover');
        expect(edits.resize).toEqual({ width: 100, height: 200, fit: 'cover' });
    });

    it('sets only fit if width and height are empty', () => {
        const edits = { resize: {} };
        handleResize('', edits, '', 'contain');
        expect(edits.resize).toEqual({ fit: 'contain' });
    });

    it('sets width only if height is empty', () => {
        const edits = { resize: {} };
        handleResize('150', edits, '', 'fill');
        expect(edits.resize).toEqual({ width: 150, fit: 'fill' });
    });
});

describe('handleSmartCrop', () => {
    it('sets faceIndex and padding if provided', () => {
        const edits = {};
        handleSmartCrop(edits, '2', '10');
        expect(edits.smartCrop).toEqual({ faceIndex: 2, padding: 10 });
    });

    it('sets only faceIndex if padding is empty', () => {
        const edits = {};
        handleSmartCrop(edits, '1', '');
        expect(edits.smartCrop).toEqual({ faceIndex: 1 });
    });

    it('sets only padding if faceIndex is empty', () => {
        const edits = {};
        handleSmartCrop(edits, '', '5');
        expect(edits.smartCrop).toEqual({ padding: 5 });
    });

    it('sets empty object if both are empty', () => {
        const edits = {};
        handleSmartCrop(edits, '', '');
        expect(edits.smartCrop).toEqual({});
    });
});

describe('importOriginalImage', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="txt-bucket-name" value="my-bucket"/>
            <input id="txt-key-name" value="my-key"/>
            <img id="img-original"/>
        `;
    });

    it('sets img-original src, data-bucket, and data-key', () => {
        // Redefine function here for test
        function importOriginalImage() {
            const bucketName = $(`#txt-bucket-name`).first().val();
            const keyName = $(`#txt-key-name`).first().val();
            const request = { bucket: bucketName, key: keyName };
            const strRequest = JSON.stringify(request);
            const encRequest = btoa(encodeURIComponent(strRequest).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode(parseInt(p1, 16))
            }));
            $(`#img-original`)
                .attr(`src`, `${appVariables.apiEndpoint}/${encRequest}`)
                .attr(`data-bucket`, bucketName)
                .attr(`data-key`, keyName);
        }

        importOriginalImage();

        const img = document.getElementById('img-original');
        expect(img.getAttribute('data-bucket')).toBe('my-bucket');
        expect(img.getAttribute('data-key')).toBe('my-key');
        expect(img.getAttribute('src')).toMatch(/^https:\/\/api\.example\.com\//);
        // Decoding the src to check correctness
        const encoded = img.getAttribute('src').split('/').pop();
        const decoded = decodeURIComponent(atob(encoded));
        expect(JSON.parse(decoded)).toEqual({ bucket: 'my-bucket', key: 'my-key' });
    });
});

describe('resetEdits', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input class="form-control" value="something"/>
            <select id="editor-resize-mode">
                <option>Disabled</option>
                <option>cover</option>
            </select>
            <input type="checkbox" class="form-check-input" checked/>
        `;
        document.getElementById('editor-resize-mode').selectedIndex = 1;
    });

    it('resets form controls and checkboxes', () => {
        function resetEdits() {
            $('.form-control').val('');
            document.getElementById('editor-resize-mode').selectedIndex = 0;
            $(".form-check-input").prop('checked', false);
        }
        resetEdits();
        expect($('.form-control').val()).toBe('');
        expect(document.getElementById('editor-resize-mode').selectedIndex).toBe(0);
        expect($('.form-check-input').prop('checked')).toBe(false);
    });
});