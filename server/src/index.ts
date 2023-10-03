import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { spawn, ChildProcess } from "child_process"
import * as fs from "fs"
import * as path from "path"

const [, , configFile] = process.argv

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8089", // your frontend server address
        allowedHeaders: ["Access-Control-Allow-Origin"],
        methods: ["GET", "POST"],
        credentials: true
    }
})

const frontendPath = path.join(__dirname, ".")
app.use(express.static(frontendPath))

// Handle SPA routing by directing all other routes to the index.html file
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"))
})

type Process = {
    path: string
    args?: string[]
    log: string[]
    logbuf: string
    process?: ChildProcess
}

function read_configuration(): Record<string, Process> {
    if (!configFile) {
        // hard coded config for use in development
        console.warn("No config file specified, using hard coded config")
        return {
            gbc: {
                path: "/tmp/gbc_deploy/cmake-build-debug/GBC",
                args: [],
                log: [],
                logbuf: ""
            },
            gbem: {
                path: "/tmp/gbem_deploy/cmake-build-debug/GBEM",
                args: [],
                log: [],
                logbuf: ""
            }
        }
    }
    try {
        return JSON.parse(fs.readFileSync(configFile, "utf-8"))
    } catch (e) {
        console.error("Failed to read config file", e.message)
        process.exit(1)
    }
}

const processes = read_configuration()

function append_log(process: Process, data: string): string[] {
    process.logbuf += data
    const lines = process.logbuf.split("\n")
    process.logbuf = lines.pop() || ""
    process.log = [...process.log, ...lines]

    const MAX_LOG_LINES = 100
    if (process.log.length > MAX_LOG_LINES) {
        process.log.splice(0, process.log.length - MAX_LOG_LINES)
    }

    return lines // these are the new lines added, if any
}

function reset_log(process: Process) {
    process.log = []
    process.logbuf = ""
}

io.on("connection", socket => {
    console.log("New client connected")

    function emit(processName: string, event: string, data: object) {
        const type = event.split("/")[0]
        if (type !== "unicast" && type !== "multicast") {
            throw new Error("Invalid event type: " + type)
        }
        if (type === "unicast") {
            socket.emit(event, { processName, ...data })
        } else {
            io.emit(event, { processName, ...data })
        }
    }

    socket.on("process/start/req", ({ processName }) => {
        // spawn a new process
        const p = processes[processName]
        if (p.process) {
            emit(processName, "unicast/process/error", { message: "Process already started" })
            return
        }

        const process = spawn(p.path, p.args || [])
        p.process = process
        reset_log(p)

        process.stdout.on("data", data => {
            const lines = append_log(p, data.toString())
            emit(processName, "multicast/process/log", { processName, lines })
        })

        process.stderr.on("data", data => {
            const lines = append_log(p, data.toString())
            emit(processName, "multicast/process/log", { processName, lines })
        })

        process.on("spawn", () => {
            console.log("Process started, sending initial log: ", processName)
            emit(processName, "multicast/process/starting", { processName, log: p.log })
        })

        process.on("error", error => {
            p.process = undefined
            emit(processName, "unicast/process/error", { processName, message: error.message })
        })

        process.on("exit", (code, signal) => {
            p.process = undefined
            reset_log(p)
            if (code !== null) {
                emit(processName, "multicast/process/exit", {
                    processName,
                    message: `Process exited with code: ${code}`
                })
            } else if (signal) {
                emit(processName, "multicast/process/exit", {
                    processName,
                    message: `Process was killed with signal: ${signal}`
                })
            }
        })
    })

    socket.on("process/stop/req", ({ processName }) => {
        const p = processes[processName]
        if (!p.process) {
            emit(processName, "unicast/process/error", { message: "Process not started" })
            return
        }
        if (!p.process.kill()) {
            emit(processName, "unicast/process/error", { message: "Failed to kill process" })
        }
    })

    socket.on("process/join/req", ({ processName }) => {
        console.log("Request to attach to process", processName)
        socket.join(processName)
        const p = processes[processName]
        emit(processName, "unicast/process/join/resp", {
            running: !!p.process,
            log: p.log || [],
            path: p.path,
            args: p.args || []
        })
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected")
    })
})

server.listen(3000, () => {
    console.log("Server listening on port 3000")
})
