import './App.css'
import { Terminal } from 'lucide-react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Badge,
  Button,
  Button_Shadcn_,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Skeleton,
  Switch,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  SonnerToaster,
} from 'ui/base'
import { toast } from 'sonner'

// Proof: none of these imports touch next/image, next/link, or next/navigation.
// If any Next.js module were reachable from ui/base, this file would fail to
// compile in a non-Next.js environment.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="demo-section">
      <h2 className="demo-section-title text-lg font-semibold text-foreground border-b border-border-muted">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function App() {
  return (
    <TooltipProvider>
      <div className="demo-page bg-background text-foreground">
        <h1 className="text-3xl font-bold">UI Base — Vite Validation</h1>
        <p className="demo-subtitle text-foreground-light text-sm">
          All components imported from{' '}
          <code className="font-mono text-xs bg-surface-200 px-1 py-0.5 rounded">ui/base</code>{' '}
          (pre-built, no Next.js).
        </p>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button type="primary" onClick={() => toast('Primary button clicked')}>
              Primary
            </Button>
            <Button type="default">Default</Button>
            <Button type="outline">Outline</Button>
            <Button type="danger">Danger</Button>
            <Button type="text">Text</Button>
            <Button_Shadcn_ variant="outline">Shadcn Button</Button_Shadcn_>
          </div>
        </Section>

        <Section title="Badges & Skeleton">
          <div className="demo-badges flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
          <div className="demo-skeletons">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </Section>

        <Section title="Form Inputs">
          <div className="demo-form">
            <div className="demo-form-field">
              <Label_Shadcn_ htmlFor="email">Email</Label_Shadcn_>
              <Input_Shadcn_ id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="demo-form-row">
              <Checkbox_Shadcn_ id="terms" />
              <Label_Shadcn_ htmlFor="terms">Accept terms</Label_Shadcn_>
            </div>
            <div className="demo-form-row">
              <Switch id="notifications" />
              <Label_Shadcn_ htmlFor="notifications">Enable notifications</Label_Shadcn_>
            </div>
            <Select_Shadcn_>
              <SelectTrigger_Shadcn_>
                <SelectValue_Shadcn_ placeholder="Select a region" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value="us-east-1">US East (N. Virginia)</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="eu-west-1">EU West (Ireland)</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="ap-southeast-1">AP Southeast (Singapore)</SelectItem_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
        </Section>

        <Section title="Card + Tabs">
          <Card className="demo-card">
            <CardHeader>
              <CardTitle>Project settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs_Shadcn_ defaultValue="general">
                <TabsList_Shadcn_>
                  <TabsTrigger_Shadcn_ value="general">General</TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="billing">Billing</TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="team">Team</TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_ value="general" className="pt-3">
                  General settings content.
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="billing" className="pt-3">
                  Billing settings content.
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="team" className="pt-3">
                  Team settings content.
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </CardContent>
          </Card>
        </Section>

        <Section title="Alert">
          <Alert_Shadcn_ className="demo-alert">
            <Terminal size={16} />
            <AlertTitle_Shadcn_>Build successful</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              All base components render correctly without Next.js.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </Section>

        <Section title="Accordion">
          <Accordion_Shadcn_ type="single" collapsible className="demo-accordion">
            <AccordionItem_Shadcn_ value="q1">
              <AccordionTrigger_Shadcn_>What is Supabase?</AccordionTrigger_Shadcn_>
              <AccordionContent_Shadcn_>
                An open source Firebase alternative built on top of Postgres.
              </AccordionContent_Shadcn_>
            </AccordionItem_Shadcn_>
            <AccordionItem_Shadcn_ value="q2">
              <AccordionTrigger_Shadcn_>Is it free?</AccordionTrigger_Shadcn_>
              <AccordionContent_Shadcn_>
                Yes — generous free tier with no credit card required.
              </AccordionContent_Shadcn_>
            </AccordionItem_Shadcn_>
          </Accordion_Shadcn_>
        </Section>

        <Separator className="demo-separator" />

        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button_Shadcn_ variant="outline">Hover for tooltip</Button_Shadcn_>
            </TooltipTrigger>
            <TooltipContent>
              Rendered via Radix UI — no Next.js required.
            </TooltipContent>
          </Tooltip>
        </Section>
      </div>

      <SonnerToaster />
    </TooltipProvider>
  )
}
