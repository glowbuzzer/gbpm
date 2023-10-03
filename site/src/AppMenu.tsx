/**
 * Application menu used by the examples, and demonstrates how to build a simple menu for your own application.
 *
 * Copyright (c) 2022. Glowbuzzer. All rights reserved
 */

import { Menu } from "antd"
import {
    useDockLayoutContext,
    useDockViewMenu
} from "./dock"
import styled from "styled-components"
import React, { useState } from "react"
import { ItemType } from "antd/es/menu/hooks/useItems"

const StyledMenuBar = styled.div`
  display: flex;

  svg {
    border-bottom: 1px solid ${props => props.theme.colorBorder};
  }

  .title {
    font-size: 1.5em;
    display: inline-block;
    padding: 10px 10px 0 14px;
    border-bottom: 1px solid ${props => props.theme.colorBorder};
    color: ${props => props.theme.colorText};
  }

  .ant-menu {
    flex-grow: 1;
  }
`

export const AppMenu = ({ title = null }) => {
    const { perspectives, currentPerspective, changePerspective } = useDockLayoutContext()
    const viewMenu = useDockViewMenu()

    // title for current perpsective (undefined if there is only a single perspective)
    const perspectiveTitle =
        perspectives.length > 1 && perspectives.find(p => p.id === currentPerspective)?.name

    const menuItems: ItemType[] = [
        viewMenu
    ]

    return (
        <StyledMenuBar>
            {title && <div className="title">{title}</div>}
            {perspectiveTitle && (
                <div className="perspective-title">
                    <span>{perspectiveTitle}</span>
                </div>
            )}
            <Menu mode="horizontal" theme="light" selectedKeys={[]} items={menuItems} />
        </StyledMenuBar>
    )
}
