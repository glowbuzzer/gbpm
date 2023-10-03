/*
 * Copyright (c) 2022. Glowbuzzer. All rights reserved
 */

import { DockPerspective } from "./types"
import { useDockContext } from "./hooks"
import { StyledDockLayout } from "./styles"
import { DockLayoutContext } from "./DockLayoutContext"
import * as React from "react"
import { DockTileDefinition } from "./DockTileDefinition"
import { ReactNode } from "react"
import { useAppName } from "./appname"

export type DockPerspectiveLayoutProviderProps = {
    /** The tiles that are available in the dock layout. These tiles are available to all perspectives even if not shown by default. */
    tiles: DockTileDefinition[]
    /** A list of perspectives that are available. Each perspective specifies the tiles that are visible by default. */
    perspectives: DockPerspective[]
    /** The id of the perspective that should be shown by default. */
    defaultPerspective: string
    /** The children of the dock layout provider. This must include {@link DockLayout}. */
    children: ReactNode
}

/**
 * The dock perspective layout provider is similar to {@link DockLayoutProvider} but allows you to specify multiple perspectives.
 * The end user can choose between these perspectives using the perspective menu. Changes that the user makes to the layout
 * are saved per perspective.
 */
export const DockPerspectiveLayoutProvider = ({
    tiles,
    perspectives,
    defaultPerspective,
    children
}: DockPerspectiveLayoutProviderProps) => {
    const appName = useAppName()
    const context = useDockContext(tiles, perspectives, defaultPerspective, appName)

    return (
        <StyledDockLayout>
            <DockLayoutContext.Provider value={context}>{children}</DockLayoutContext.Provider>
        </StyledDockLayout>
    )
}
