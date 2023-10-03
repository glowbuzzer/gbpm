import React, { useEffect, useRef, useState } from "react"
import { useConnection } from "../connection/ConnectionProvider"
import { Button, message, Tag } from "antd"
import styled from "styled-components"

const StyledDiv = styled.div`
    padding: 10px;
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 10px;

    .header {
        display: flex;
        align-items: center;
        gap: 10px;

        .status {
            flex-grow: 1;
            //text-align: center;
        }
        .path {
            font-family: monospace;
            outline: 1px solid ${props => props.theme.colorBorder};
            padding: 4px 8px;
            border-radius: 4px;
            opacity: 0.8;
        }
    }

    .log-outer {
        flex-grow: 1;
        padding: 10px;
        display: flex;
        flex-direction: column;

        .log-container {
            position: relative;
            flex-grow: 1;

            .log {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                font-family: monospace;
                opacity: 0.8;
                overflow-y: auto;
            }
        }
    }
`

export const ProcessTile = ({ processName }) => {
    const { connected, connection: socket } = useConnection()
    const connectionRef = useRef(null)
    const [log, setLog] = useState<string[]>([])
    const [running, setRunning] = useState(false)
    const [path, setPath] = useState<string>("")
    const logRef = useRef<HTMLDivElement>(null)

    const [messageApi, contextHolder] = message.useMessage()

    useEffect(() => {
        if (logRef.current) {
            console.log("SCROLLING", logRef.current.scrollTop, logRef.current.scrollHeight)
            logRef.current.scrollTo({ top: logRef.current.scrollHeight })
        }
    }, [log])

    useEffect(() => {
        if (connectionRef.current === socket) {
            // this happens during hot reload - we don't want to reattach
            return
        }
        connectionRef.current = socket

        if (connected) {
            function log({ lines }: { lines: string[] }) {
                setLog(current => [...current, ...lines])
            }

            function error({ message }) {
                console.error(message)
                return messageApi.error(message)
            }

            function starting({ log }: { log: string[] }) {
                setRunning(true)
                setLog(_ => log || [])
                return messageApi.success("Process started")
            }

            function exit({ message }) {
                setRunning(false)
                return messageApi.info(message)
            }

            function join_response({ running, path, args, log }) {
                console.log("JOIN RESPONSE", processName, running, path)
                setRunning(running)
                setPath(`${path} ${args.join(" ")}`)
                setLog(_ => log || [])
            }

            console.log("JOINING", processName)
            socket.emit("process/join/req", { processName })

            function filter(handler) {
                return function (data) {
                    if (data.processName === processName) {
                        return handler(data)
                    }
                }
            }

            const events = {
                "unicast/process/join/resp": filter(join_response),
                "unicast/process/error": filter(error),
                "multicast/process/starting": filter(starting),
                "multicast/process/log": filter(log),
                "multicast/process/exit": filter(exit)
            }

            // wire up all events
            Object.entries(events).forEach(([event, handler]) => {
                socket.on(event, handler)
            })

            return () => {
                // unwire all events
                Object.entries(events).forEach(([event, handler]) => {
                    socket.off(event, handler)
                })
            }
        }
    }, [connected])

    return (
        <StyledDiv>
            {contextHolder}
            <div className="header">
                <Button
                    size="small"
                    onClick={() => socket.emit("process/start/req", { processName })}
                    disabled={!connected || running}
                >
                    Start
                </Button>
                <Button
                    size="small"
                    onClick={() => socket.emit("process/stop/req", { processName })}
                    disabled={!connected || !running}
                >
                    Stop
                </Button>
                <div className="status">
                    <Tag color={running ? "green" : "red"}>
                        {running ? "RUNNING" : "NOT RUNNING"}
                    </Tag>
                </div>
                <div className="path">{path}</div>
            </div>
            <div className="log-outer">
                <div className="log-container">
                    <div className="log" ref={logRef}>
                        {log.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        </StyledDiv>
    )
}
