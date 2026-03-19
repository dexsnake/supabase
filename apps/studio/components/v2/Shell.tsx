'use client'

import { MobileSheetProvider } from 'components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { LayoutSidebar } from 'components/layouts/ProjectLayout/LayoutSidebar'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, SidebarProvider } from 'ui'

import { LeftActivityBar } from './ActivityBar'
import { BrowserPanel } from './BrowserPanel'
import { EditorFrame } from './EditorFrame'
import { RightActivityBar } from './RightActivityBar'
import { TopBar } from './TopBar'
import { V2LayoutSidebarProvider } from './V2LayoutSidebarProvider'
import { V2DashboardProvider } from '@/stores/v2-dashboard'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <V2DashboardProvider>
      <SidebarProvider defaultOpen={false}>
        <MobileSheetProvider>
          <V2LayoutSidebarProvider>
            <div className="flex flex-col h-screen w-screen bg-background text-foreground">
              <TopBar />
              <div className="flex flex-1 min-h-0">
                <LeftActivityBar />
                <ResizablePanelGroup
                  orientation="horizontal"
                  className="h-full w-full overflow-x-hidden flex-1 flex flex-row gap-0"
                  autoSaveId="v2-shell-content"
                >
                  <ResizablePanel id="panel-browser" minSize={200} maxSize={350} defaultSize={240}>
                    <BrowserPanel />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel id="panel-content">
                    <main className="flex-1 min-w-0 flex flex-col overflow-hidden h-full">
                      <EditorFrame>{children}</EditorFrame>
                    </main>
                  </ResizablePanel>
                  <LayoutSidebar minSize={350} maxSize={500} defaultSize={350} />
                </ResizablePanelGroup>
                <RightActivityBar />
              </div>
            </div>
          </V2LayoutSidebarProvider>
        </MobileSheetProvider>
      </SidebarProvider>
    </V2DashboardProvider>
  )
}
