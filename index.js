const sharp = require("sharp");
const fs = require("fs").promises;
const { createWriteStream } = require("fs");
const archiver = require("archiver");
const path = require("path");

// 确保dist目录存在
const distDir = "dist";
fs.mkdir(distDir, { recursive: true }, (err) => {
  if (err) throw err;
});

async function convertSvgToPng(svgPath, outputSizes, outputDir) {
  try {
    const svgBuffer = await fs.readFile(svgPath);

    for (const size of outputSizes) {
      // 修改输出路径到dist目录
      const outputPath = path.join(outputDir, `output-${size}x${size}.png`);
      await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
    }

    console.log("转换完成");
  } catch (error) {
    console.error("转换过程中出错:", error);
  }
}

// 创建归档的函数
async function createArchive(archiveName, ...files) {
  const output = createWriteStream(archiveName);
  const archive = archiver("zip", { zlib: { level: 9 } }); // 定义压缩级别

  output.on("close", function () {
    console.log(`归档文件 ${archiveName} 创建完成.`);
  });

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw err;
  });

  archive.pipe(output);

  files.forEach((file) => {
    archive.file(file, { name: path.basename(file) });
  });

  archive.finalize();
}

async function getDirFilePath(dir) {
  const files = await fs.readdir(dir);
  return files.map((p) => {
    return path.join(dir, p);
  });
}

// png 生成大小
const sizes = [16, 32, 64, 128, 144, 256, 512, 1024, 2048, 4096, 8192];

(async function () {
  // 转换图片并输出到dist目录
  await convertSvgToPng("input.svg", sizes, distDir);
  // 转换完成后，创建归档
  await createArchive(
    "归档.zip",
    "input.svg",
    ...(await getDirFilePath(distDir))
  );
})().catch(console.error); // 添加错误处理
