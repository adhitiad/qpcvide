import { Link, Form } from "react-router";
import { SearchBar } from "./SearchBar";
import { AdDisplay } from "./ads/AdDisplay";
import { Search, ChevronDown, User, Sparkles, Bot } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Menu } from "lucide-react";
import { useRouteLoaderData } from "react-router";

export function Header() {
  const rootData = useRouteLoaderData("root") as any;
  const user = rootData?.user;

  const specialCategories = [
    { name: "BDSM", slug: "bdsm" },
    { name: "Threesome", slug: "threesome" },
    { name: "MILF", slug: "milf" },
    { name: "NTR", slug: "ntr" },
    { name: "Yuri", slug: "yuri" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-night-border gradient-header backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="font-serif text-2xl font-bold gradient-text group-hover:glow-accent transition-glow">
            Auiso
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block px-4">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className="text-night-text hover:text-night-accent transition-colors"
          >
            Home
          </Link>
          <Link
            to="/recommended"
            className="text-night-text hover:text-night-accent transition-colors"
          >
            For You
          </Link>
          <Link
            to="/search"
            className="text-night-text hover:text-night-accent transition-colors"
          >
            Browse
          </Link>
          <Link
            to="/search-ai"
            className="text-night-cyan hover:text-night-accent flex items-center gap-1 transition-colors font-bold"
          >
            <Sparkles className="w-4 h-4" /> AI Search
          </Link>
          <Link
            to="/chat"
            className="text-night-accent hover:text-white flex items-center gap-1 transition-colors font-bold relative group"
          >
            <Bot className="w-4 h-4" /> AI Chat
            <span className="absolute -top-3 -right-4 bg-red-500 text-white text-[9px] px-1 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity">18+</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-night-text hover:text-night-accent transition-colors focus:outline-none">
                Categories <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-night-card border-night-border text-night-text">
              {specialCategories.map((cat) => (
                <DropdownMenuItem
                  key={cat.slug}
                  asChild
                  className="hover:bg-night-hover focus:bg-night-hover cursor-pointer"
                >
                  <Link to={`/category/${cat.slug}`} className="w-full">
                    {cat.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Search, Auth, and Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="md:hidden flex-1 min-w-0">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-night-text hover:bg-night-hover">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{user.username}</span>
                    {user.role === "premium" && (
                      <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded ml-1">PRO</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-night-card border-night-border text-night-text" align="end">
                  {user.role === "user" && (
                    <DropdownMenuItem asChild className="hover:bg-night-hover cursor-pointer text-yellow-500 font-bold">
                      <Link to="/upgrade">Upgrade Premium</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild className="hover:bg-night-hover cursor-pointer text-night-accent">
                      <Link to="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="hover:bg-night-hover cursor-pointer">
                    <Link to="/advertise">Buy Ads</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-night-hover cursor-pointer text-red-500">
                    <Form method="post" action="/logout" className="w-full">
                      <button type="submit" className="w-full text-left">Logout</button>
                    </Form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:flex text-night-text hover:bg-night-hover hover:text-night-accent"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="hidden sm:flex bg-night-accent hover:bg-night-accent-light text-white card-hover"
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-night-text hover:bg-night-hover">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-night-card border-night-border text-night-text w-[250px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-serif text-xl font-bold gradient-text">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Link to="/" className="text-night-text hover:text-night-accent transition-colors text-lg">Home</Link>
                  <Link to="/recommended" className="text-night-text hover:text-night-accent transition-colors text-lg">For You</Link>
                  <Link to="/search" className="text-night-text hover:text-night-accent transition-colors text-lg">Browse</Link>
                  <Link to="/search-ai" className="text-night-cyan hover:text-night-accent transition-colors text-lg flex items-center gap-2 font-bold"><Sparkles className="w-5 h-5"/> AI Search</Link>
                  <Link to="/chat" className="text-night-accent hover:text-white transition-colors text-lg flex items-center gap-2 font-bold"><Bot className="w-5 h-5"/> AI Chat <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm">18+</span></Link>
                  
                  <div className="pt-4 border-t border-night-border">
                    <h4 className="text-sm font-semibold text-night-muted mb-3">Categories</h4>
                    <div className="flex flex-col gap-3">
                      {specialCategories.map((cat) => (
                        <Link key={cat.slug} to={`/category/${cat.slug}`} className="text-night-text hover:text-night-accent transition-colors">
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {!user && (
                    <div className="pt-4 border-t border-night-border flex flex-col gap-3">
                      <Button asChild variant="outline" className="w-full border-night-border hover:bg-night-hover">
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild className="w-full bg-night-accent hover:bg-night-accent-light text-white">
                        <Link to="/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      </header>
      <div className="container mx-auto px-4 mt-4">
        <AdDisplay position="header" />
      </div>
    </>
  );
}
