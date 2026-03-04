import { useAppSelector } from '../store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, permissions, company, isPlatformOwner } =
    useAppSelector((state) => state.auth);

  const canView = (module: string) =>
    isPlatformOwner || (permissions?.modules?.[module]?.view ?? false);
  const canCreate = (module: string) =>
    isPlatformOwner || (permissions?.modules?.[module]?.create ?? false);
  const canUpdate = (module: string) =>
    isPlatformOwner || (permissions?.modules?.[module]?.update ?? false);
  const canDelete = (module: string) =>
    isPlatformOwner || (permissions?.modules?.[module]?.delete ?? false);

  return { user, isAuthenticated, isLoading, permissions, company, isPlatformOwner, canView, canCreate, canUpdate, canDelete };
}
