import program from "commander"
import webpack from "webpack"
import glob from "glob"
import child_process = require("child_process")
import fs = require("fs-extra")
import path = require("path")
import { run } from './index'
program.version('v' + require('../package.json').version)
    .description('根据.proto 生成 proto.d.ts proto.js')
    .option("-s, --src [src]", "proto文件地址", "*.proto")
    .option("-c, --cwd [cwd]", "proto文件所在目录地址 默认 .", ".")
    .option("-o, --outdir [outdir]", "文件导出地址", "./dist")
    .option("-p, --protoc [protoc]", "protoc命令地址, windows下面用来指向protoc.exe, 如果环境变量中有就不用改了", "protoc")
    .option("-j, --js", "是否生成proto.js")
    .parse(process.argv)
const { src, cwd, outdir, protoc, js } = program
const dist = path.resolve(process.cwd(), outdir)
fs.mkdirpSync(dist)
const files = glob.sync(src, { cwd })
if (js) {
    const build = path.join(dist, "build")
    fs.mkdirpSync(build)
    const cmd = `${protoc} --js_out=import_style=commonjs,binary:${build} ${files.join(" ")}`
    child_process.execSync(cmd, { cwd, encoding: "utf8" })
    webpack({
        entry: files.map(x => x.replace(/.proto$/, "_pb.js")).map(x => path.join(build, x)),
        mode: "production",
        output: { path: dist, filename: "proto.js" },
        performance: { hints: false },
        resolve: {
            "alias": { "google-protobuf": require.resolve("google-protobuf") }
        }
    }).run((err, message) => {
        if (err) console.error(err)
        else console.log(message.toString({ colors: true }))
    })
}
const stream = fs.createWriteStream(path.join(dist, "proto.d.ts"))
run(files.map(x => path.join(cwd, x)), stream)