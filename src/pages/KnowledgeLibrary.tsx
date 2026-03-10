import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, FileText, PlayCircle, BookOpen, HelpCircle, Download, Eye, Calendar, User, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";

const KnowledgeLibrary = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const knowledgeAssets = [
    {
      id: 1,
      title: "Advanced Troubleshooting Procedures",
      description: "Complete guide for handling complex customer escalations and decision-making criteria",
      type: "Guide",
      icon: FileText,
      sme: "Sarah Johnson",
      date: "2025-01-15",
      duration: "45 min session",
      tags: ["Customer Success", "Escalation", "Troubleshooting"],
      formats: ["Written Guide", "Audio Snippets", "FAQ"],
      views: 127,
      status: "Ready"
    },
    {
      id: 2,
      title: "Database Performance Optimization",
      description: "Expert techniques for identifying and resolving database bottlenecks",
      type: "Course",
      icon: BookOpen,
      sme: "Marcus Chen",
      date: "2025-01-12",
      duration: "30 min session", 
      tags: ["Database", "Performance", "Technical"],
      formats: ["Interactive Course", "Code Examples", "Quiz"],
      views: 89,
      status: "Ready"
    },
    {
      id: 3,
      title: "Sales Objection Handling Masterclass",
      description: "Advanced strategies for overcoming common and uncommon sales objections",
      type: "Training",
      icon: PlayCircle,
      sme: "Jennifer Liu",
      date: "2025-01-10",
      duration: "60 min session",
      tags: ["Sales", "Communication", "Strategy"],
      formats: ["Video Modules", "Role-play Scenarios", "Checklist"],
      views: 234,
      status: "Ready"
    },
    {
      id: 4,
      title: "Compliance Audit Preparation",
      description: "Step-by-step process for preparing and managing regulatory compliance audits",
      type: "Process",
      icon: HelpCircle,
      sme: "Robert Davis",
      date: "2025-01-08",
      duration: "25 min session",
      tags: ["Compliance", "Audit", "Legal"],
      formats: ["Process Map", "Checklist", "Templates"],
      views: 56,
      status: "In Progress"
    }
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "customer-success", label: "Customer Success" },
    { value: "technical", label: "Technical" },
    { value: "sales", label: "Sales" },
    { value: "compliance", label: "Compliance" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Guide": return "bg-blue-100 text-blue-700";
      case "Course": return "bg-purple-100 text-purple-700";
      case "Training": return "bg-orange-100 text-orange-700";
      case "Process": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold">
              Knowledge{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Library
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Search and access all captured knowledge assets generated from SME sessions
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Knowledge Assets Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {knowledgeAssets.map((asset) => (
            <Card key={asset.id} className="border-0 shadow-elegant hover:shadow-glow transition-smooth group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <asset.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-smooth">
                        {asset.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTypeColor(asset.type)}>
                          {asset.type}
                        </Badge>
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {asset.description}
                </CardDescription>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {asset.sme}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {asset.date}
                  </div>
                  <div className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    {asset.views} views
                  </div>
                  <div className="flex items-center">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {asset.duration}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Available Formats */}
                <div>
                  <p className="font-medium mb-2">Available Formats:</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.formats.map((format, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="bg-gradient-primary hover:shadow-glow transition-smooth">
                    <Eye className="mr-2 h-4 w-4" />
                    View Assets
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-elegant text-center p-6">
            <div className="text-2xl font-bold text-primary mb-2">24</div>
            <div className="text-sm text-muted-foreground">Total Assets</div>
          </Card>
          
          <Card className="border-0 shadow-elegant text-center p-6">
            <div className="text-2xl font-bold text-accent mb-2">12</div>
            <div className="text-sm text-muted-foreground">Active SMEs</div>
          </Card>
          
          <Card className="border-0 shadow-elegant text-center p-6">
            <div className="text-2xl font-bold text-primary-glow mb-2">180h</div>
            <div className="text-sm text-muted-foreground">Knowledge Captured</div>
          </Card>
          
          <Card className="border-0 shadow-elegant text-center p-6">
            <div className="text-2xl font-bold text-primary mb-2">1.2k</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeLibrary;