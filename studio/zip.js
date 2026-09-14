/* ============================================================
   Minimal ZIP writer (stored / no compression).
   No dependencies — produces a real .zip a browser or Windows
   Explorer can open, with folders preserved.
   ============================================================ */
(function (root) {
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function toBytes(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    return new TextEncoder().encode(String(data));
  }

  function dosTime(d) {
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
  }
  function dosDate(d) {
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  }

  function W(size) {
    var b = new Uint8Array(size), o = 0;
    return {
      u8: function (v) { b[o++] = v & 255; return this; },
      u16: function (v) { b[o++] = v & 255; b[o++] = (v >>> 8) & 255; return this; },
      u32: function (v) { b[o++] = v & 255; b[o++] = (v >>> 8) & 255; b[o++] = (v >>> 16) & 255; b[o++] = (v >>> 24) & 255; return this; },
      bytes: function (arr) { b.set(arr, o); o += arr.length; return this; },
      done: function () { return b.subarray(0, o); }
    };
  }

  /* files: [{ name:'path/in/zip.txt', data: string|Uint8Array }] */
  function makeZip(files) {
    var now = new Date();
    var enc = new TextEncoder();
    var parts = [], central = [], offset = 0;

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var data = toBytes(f.data);
      var crc = crc32(data);

      var local = W(30 + nameBytes.length)
        .u32(0x04034b50).u16(20).u16(0x0800).u16(0)      // flags: UTF-8 names
        .u16(dosTime(now)).u16(dosDate(now))
        .u32(crc).u32(data.length).u32(data.length)
        .u16(nameBytes.length).u16(0)
        .bytes(nameBytes).done();

      parts.push(local, data);

      central.push(W(46 + nameBytes.length)
        .u32(0x02014b50).u16(20).u16(20).u16(0x0800).u16(0)
        .u16(dosTime(now)).u16(dosDate(now))
        .u32(crc).u32(data.length).u32(data.length)
        .u16(nameBytes.length).u16(0).u16(0)
        .u16(0).u16(0).u32(0)
        .u32(offset)
        .bytes(nameBytes).done());

      offset += local.length + data.length;
    });

    var centralSize = central.reduce(function (s, c) { return s + c.length; }, 0);
    var end = W(22)
      .u32(0x06054b50).u16(0).u16(0)
      .u16(files.length).u16(files.length)
      .u32(centralSize).u32(offset).u16(0).done();

    return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
  }

  root.MiniZip = { make: makeZip, crc32: crc32 };
})(window);
