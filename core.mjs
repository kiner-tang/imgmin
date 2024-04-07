import fs from "fs";
import path from "path";
import { conver } from "./tools.mjs";
import ora from "ora";
import FileUploader from "./fileUploader.mjs";

const exts = [".jpg", ".png", ".jpeg"],
  max = 5200000; // 5MB == 5242848.754299136

function getFileList(folder) {
  return new Promise((resolve, reject) => {
    fs.readdir(folder, async (err, files) => {
      if (err) reject(err);
      const validFiles = [];
      for (let i = 0; i < files.length; i++) {
        if (await fileFilter(path.join(folder, files[i]))) {
          validFiles.push(files[i]);
        }
      }
      resolve(validFiles);
    });
  });
}

// 过滤文件格式，返回所有jpg,png图片
function fileFilter(file) {
  return new Promise((resolve, reject) => {
    fs.stat(file, (err, stats) => {
      if (err) reject(err);
      else
        resolve(
          stats.size <= max &&
            stats.isFile() &&
            exts.includes(path.extname(file))
        );
    });
  });
}

function showStepInfo(imgPath, res, isSilent) {
  var originalSize = res.input.size;
  var newSize = res.output.size;
  !isSilent &&
    console.log(
      `📦 [${imgPath}] 压缩成功，原始大小(${conver(
        originalSize
      )})，压缩大小(${conver(newSize)})，压缩率：${(
        (1 - newSize / originalSize) *
        100
      ).toFixed(2)}%`
    );
}

async function doMain(
  cwd,
  outputPath = "",
  isExitWhenComplete = true,
  isSilent = false
) {
  let fileCount = 0;
  let successCount = 0;
  let completeCount = 0;
  let originalSize = 0;
  let newSize = 0;

  let outputDir = outputPath;
  const root = path.resolve(cwd);
  const stat = fs.lstatSync(root);
  if (stat.isFile()) {
    if (!outputDir) outputDir = cwd.substring(0, cwd.lastIndexOf("/"));
    const file = root;
    const loadingText = "压缩中，请稍后...";
    const spinner = ora(loadingText);
    spinner.start();
    const fileUploader = new FileUploader(outputDir);
    try {
      const { res, imgPath } = await fileUploader.doUpload(file);
      spinner.stop();
      showStepInfo(imgPath, res, isSilent);
      isExitWhenComplete && process.exit(0);
      return {
        res,
        imgPath,
      };
    } catch (e) {
      !isSilent && console.error("上传图片失败：", e);
      isExitWhenComplete && process.exit(0);
      return {
        imgPath: file,
        res: e,
      };
    }
  } else {
    if (!outputDir) outputDir = path.resolve(cwd + "/output");
    else outputDir = path.resolve(`${cwd}/${outputDir}`);
    const fileUploader = new FileUploader(outputDir);
    const spinner = ora();
    const fileList = await getFileList(root);

    for (let i = 0; i < fileList.length; i++) {
      const file = path.join(cwd, fileList[i]);
      spinner.start(`正在压缩[${i + 1}/${fileList.length}]，请稍后...`);
      try {
        const { res, imgPath } = await fileUploader.doUpload(file);
        successCount++;
        completeCount++;
        originalSize += res.input.size;
        newSize += res.output.size;
        spinner.stop();
        showStepInfo(imgPath, res, isSilent);
        if (completeCount === fileList.length) {
          !isSilent &&
            console.log(
              `🎉 总共有 ${fileList.length} 张图片，成功压缩 ${successCount} 张图片\n📢 原大小：${conver(
                originalSize
              )}，压缩后为：${conver(newSize)},压缩率：${(
                (1 - newSize / originalSize) *
                100
              ).toFixed(2)}%`
            );
        }
      } catch (e) {
        spinner.stop();
        completeCount++;
        !isSilent && console.error("😭 图片压缩失败", e);
      }
    }
  }
}

export default doMain;
