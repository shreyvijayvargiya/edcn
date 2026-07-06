import { useState } from "react";
import {
	HelpCircle,
	LifeBuoy,
	LogOut,
	Mail,
	Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DEMO_USER, formatWorkspaceDate } from "@/lib/video-editor/workspace";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function DemoActionButton({ icon: Icon, label, onClick }) {
	return (
		<Button
			variant="outline"
			className="w-full justify-start gap-2 h-9 text-xs"
			onClick={onClick}
		>
			<Icon className="h-3.5 w-3.5 text-muted-foreground" />
			{label}
		</Button>
	);
}

export default function LeftPanelUserSection() {
	const [open, setOpen] = useState(false);

	const demoToast = (message) => {
		toast.message(message);
	};

	return (
		<>
			<div className="shrink-0 border-t-2 border-border p-2 flex flex-col items-center">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className={cn(
						"h-9 w-9 rounded-full border-2 border-border bg-primary/15 text-primary",
						"text-xs font-bold flex items-center justify-center",
						"hover:bg-primary/25 transition-colors",
					)}
					title={DEMO_USER.name}
				>
					{DEMO_USER.initials}
				</button>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Account</DialogTitle>
						<DialogDescription>Demo profile — authentication coming soon.</DialogDescription>
					</DialogHeader>

					<div className="flex items-center gap-3">
						<div className="h-14 w-14 rounded-full border-2 border-border bg-primary/15 text-primary text-lg font-bold flex items-center justify-center shrink-0">
							{DEMO_USER.initials}
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-foreground">{DEMO_USER.name}</p>
							<p className="text-xs text-muted-foreground truncate">{DEMO_USER.email}</p>
						</div>
					</div>

					<div className="rounded-lg border-2 border-border bg-muted/20 p-3 space-y-2">
						<div className="flex items-center justify-between gap-2 text-xs">
							<span className="text-muted-foreground">Member since</span>
							<span className="font-medium text-foreground">
								{formatWorkspaceDate(DEMO_USER.createdAt)}
							</span>
						</div>
					</div>

					<Separator />

					<div className="grid gap-2">
						<DemoActionButton
							icon={Settings}
							label="Settings"
							onClick={() => demoToast("Settings page — demo only.")}
						/>
						<DemoActionButton
							icon={LifeBuoy}
							label="Support"
							onClick={() => demoToast("Support — demo only. Email support@edcn.app")}
						/>
						<DemoActionButton
							icon={Mail}
							label="Contact"
							onClick={() => demoToast("Contact — demo only.")}
						/>
						<DemoActionButton
							icon={HelpCircle}
							label="Help center"
							onClick={() => demoToast("Help center — demo only.")}
						/>
					</div>

					<Button
						variant="outline"
						className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
						onClick={() => demoToast("Signed out (demo).")}
					>
						<LogOut className="h-4 w-4" />
						Sign out
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
