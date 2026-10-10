import {
    BarChart3,
    LogOut,
    TrendingUp,
    MessageSquare,
    Clock,
    BookOpen,
    PieChart,
    ChevronRight,
    Sparkles
} from 'lucide-react';

console.log("Checking icons...");
const icons = {
    BarChart3,
    LogOut,
    TrendingUp,
    MessageSquare,
    Clock,
    BookOpen,
    PieChart,
    ChevronRight,
    Sparkles
};

Object.entries(icons).forEach(([name, component]) => {
    if (typeof component === 'undefined') {
        console.error(`❌ MISSING ICON: ${name}`);
    } else {
        console.log(`✅ Found: ${name}`);
    }
});
