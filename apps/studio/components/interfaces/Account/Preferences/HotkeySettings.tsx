import { zodResolver } from '@hookform/resolvers/zod'
import { LOCAL_STORAGE_KEYS } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  KeyboardShortcut,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

const HotkeySchema = z.object({
  commandMenuEnabled: z.boolean(),
  aiAssistantEnabled: z.boolean(),
  inlineEditorEnabled: z.boolean(),
  copyMarkdownEnabled: z.boolean(),
  copyJsonEnabled: z.boolean(),
  downloadCsvEnabled: z.boolean(),
})

export const HotkeySettings = () => {
  const [inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.EDITOR_PANEL),
    true
  )
  const [commandMenuEnabled, setCommandMenuEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU,
    true
  )
  const [aiAssistantEnabled, setAiAssistantEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.AI_ASSISTANT),
    true
  )
  const [copyMarkdownEnabled, setCopyMarkdownEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COPY_MARKDOWN,
    true
  )
  const [copyJsonEnabled, setCopyJsonEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_COPY_JSON,
    true
  )
  const [downloadCsvEnabled, setDownloadCsvEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_DOWNLOAD_CSV,
    true
  )

  const form = useForm<z.infer<typeof HotkeySchema>>({
    resolver: zodResolver(HotkeySchema),
    values: {
      commandMenuEnabled: commandMenuEnabled ?? true,
      aiAssistantEnabled: aiAssistantEnabled ?? true,
      inlineEditorEnabled: inlineEditorEnabled ?? true,
      copyMarkdownEnabled: copyMarkdownEnabled ?? true,
      copyJsonEnabled: copyJsonEnabled ?? true,
      downloadCsvEnabled: downloadCsvEnabled ?? true,
    },
  })

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="keyboard-shortcuts">Keyboard shortcuts</PageSectionTitle>
          <PageSectionDescription>
            Choose which shortcuts stay active while working in the dashboard.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <Card>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="commandMenuEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'k']} />
                        <span>Command menu</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setCommandMenuEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="aiAssistantEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'i']} />
                        <span>AI Assistant Panel</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setAiAssistantEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="inlineEditorEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'e']} />
                        <span>Inline SQL Editor Panel</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setInlineEditorEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="copyMarkdownEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'm']} />
                        <span>Copy results as Markdown</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setCopyMarkdownEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent className="border-b">
              <FormField_Shadcn_
                control={form.control}
                name="copyJsonEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'o']} />
                        <span>Copy results as JSON</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setCopyJsonEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="downloadCsvEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={
                      <div className="flex items-center gap-x-3">
                        <KeyboardShortcut keys={['Meta', 'l']} />
                        <span>Download results as CSV</span>
                      </div>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => {
                          field.onChange(value)
                          setDownloadCsvEnabled(value)
                        }}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
