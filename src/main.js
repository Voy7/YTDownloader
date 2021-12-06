// Import node moduales
const package = require("../package.json")
const ytdl = require("ytdl-core")
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
const ffmpeg = require("fluent-ffmpeg")
const readline = require("readline")
const colors = require("colors")
const terminal = require('terminal-kit').terminal;
const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
ffmpeg.setFfmpegPath(ffmpegPath)

// Global variables / settings
fileType = 'mp3'
lines = 9
webServer = undefined
webPort = 777

// Function for when someone types anything.
async function promptMain() {
    interface.question("", async function (answer) {
        let line = lines + 1
        lines = lines + 2
        switch (answer) {
            case "mp3":
                fileType = "mp3"
                process.stdout.cursorTo(0, line)
                process.stdout.write(`File type switched to: ${fileType}`.green + `\n`)
                promptMain()
                break
            case "stop":
                process.exit()
                break
            case "mp4":
                fileType = "mp4"
                process.stdout.cursorTo(0, line)
                process.stdout.write(`File type switched to: ${fileType}`.green + `\n`)
                promptMain()
                break
            case "stop":
                process.exit()
                break
            default: // Download from YouTube link.
                try {
                    let info = await ytdl.getBasicInfo(answer)
                    let fileName = info.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-')
                    let targetFileType = fileType
                    process.stdout.cursorTo(0, line)
                    process.stdout.write(`${info.videoDetails.title}`.cyan + ` ... `.gray + `${targetFileType} Initializing...`.yellow + `\n`)
                    promptMain()
                    // Depending on the file type, use different filters.
                    switch (fileType) {
                        case "mp3":
                            stream = ytdl(answer, { filter: "audioonly", quality: "highestaudio" })
                            break
                        case "mp4":
                            stream = ytdl(answer, {})
                            break
                    }
                    proc = new ffmpeg({ source: stream })
                    await proc.saveToFile(`./Downloads/${fileName}.${fileType}`)

                    // Progress bar.
                    let fileSize = 0
                    proc.on('progress', (progress) => {
                        terminal.saveCursor()
                        process.stdout.cursorTo(0, line)
                        process.stdout.write(`${info.videoDetails.title}`.cyan + ` ... `.gray + `${targetFileType} ${progress.targetSize} KB Downloaded...`.yellow + `\n`)
                        fileSize = progress.targetSize
                        terminal.restoreCursor()
                    })
                    // Download done.
                    proc.on("end", () => {
                        terminal.saveCursor()
                        process.stdout.cursorTo(0, line)
                        process.stdout.write(`${info.videoDetails.title}`.cyan + ` ... `.gray + `${targetFileType} Done! ${fileSize} KB Downloaded.`.green + `\n`)
                        terminal.restoreCursor()
                    })
                }
                catch { // Error usually from the youtube link not actually being a link.
                    process.stdout.cursorTo(0, line)
                    process.stdout.write(`Sorry! That YouTube link is invalid. Type 'mp3' or 'mp4' if you want to switch file types.`.red + `\n`)
                    promptMain()
                }
        }
    })
}

// Starting message.
console.clear()
console.log(
    `\n----------------------------------------------`.gray +
    `\n     YouTube Downloader v${package.version} by Voy.`.yellow +
    `\n\n      Paste the link and press ENTER.`.gray +
    `\n  Type 'mp3' or 'mp4' to switch file types.`.gray +
    `\n             Default mode: `.gray + `${fileType}`.green +
    `\n----------------------------------------------\n`.gray)

// Start excepting answers.
promptMain()