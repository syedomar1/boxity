import { Navigate, useLocation } from "react-router-dom";
import { useInsForgeAuth } from "@/contexts/InsForgeAuthContext";

interface InsForgeProtectedRouteProps {
    children: React.ReactNode;
}

export const InsForgeProtectedRoute = ({ children }: InsForgeProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useInsForgeAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login2" replace state={{ returnTo: location.pathname }} />;
    }

    return <>{children}</>;
};
