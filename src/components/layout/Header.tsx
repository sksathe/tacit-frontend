import { Button } from "@/components/ui/button";
import { Brain, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type HeaderProps = {
  fullWidth?: boolean;
};

const Header = ({ fullWidth = false }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Contract Rev Rec POC", href: "/contract-revrec", isExternal: false },
    { name: "Product", href: "#features", isExternal: false },
    { name: "How it Works", href: "#how-it-works", isExternal: false },
    { name: "Login / Signup", href: "/login", isExternal: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95">
      <div
        className={`flex h-[4.5rem] items-center justify-between px-4 sm:px-6 xl:px-8 2xl:px-10 ${
          fullWidth ? "w-full" : "container"
        }`}
      >
        <div className="flex items-center space-x-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-primary">
            Tacit-AI
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-7">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground/90 hover:text-foreground transition-smooth"
            >
              {item.name}
            </a>
          ))}
        </nav>


        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[360px]">
            <nav className="mt-10 flex flex-col space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-smooth"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
