import { useNavigate } from "react-router-dom";
import { X, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComparison } from "@/hooks/useComparison";

const ComparisonBar = () => {
  const navigate = useNavigate();
  const { properties, removeFromComparison, clearComparison } = useComparison();

  if (properties.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-fit">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">
                Compare ({properties.length}/4)
              </span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg min-w-fit"
                >
                  <span className="text-sm text-foreground truncate max-w-[150px]">
                    {property.title}
                  </span>
                  <button
                    onClick={() => removeFromComparison(property.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 min-w-fit">
            <Button
              variant="outline"
              size="sm"
              onClick={clearComparison}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/compare")}
              disabled={properties.length < 2}
            >
              Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;
