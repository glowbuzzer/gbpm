import React from "react"
import { DockLayout, DockLayoutProvider, DockTileDefinitionBuilder } from "./dock"
import { GlowbuzzerThemeProvider } from "./dock/GlowbuzzerThemeProvider"

import "./App.css"
import { ProcessTile } from "./tiles/ProcessTile"
import { AppMenu } from "./AppMenu"
import { ConnectionProvider } from "./connection/ConnectionProvider"

const ProcessTileDefinitionGbc = DockTileDefinitionBuilder()
    .id("process-gbc")
    .name("GBC")
    .render(() => <ProcessTile processName="gbc" />)
    .placement(0, 0)
    .build()

const ProcessTileDefinitionGbem = DockTileDefinitionBuilder()
    .id("process-gbem")
    .name("GBEM")
    .render(() => <ProcessTile processName="gbem" />)
    .placement(0, 1)
    .build()

export const App = () => {
    return (
        <GlowbuzzerThemeProvider>
            <ConnectionProvider>
                <DockLayoutProvider tiles={[ProcessTileDefinitionGbc, ProcessTileDefinitionGbem]}>
                    <AppMenu title={"Glowbuzzer Process Manager"} />
                    <DockLayout />
                </DockLayoutProvider>
            </ConnectionProvider>
        </GlowbuzzerThemeProvider>
    )
}
