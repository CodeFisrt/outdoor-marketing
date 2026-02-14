import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ContactUs } from './pages/contact-us/contact-us';
import { OurWork } from './pages/our-work/our-work';
import { Blog } from './pages/blog/blog';
import { BlogDetails } from './pages/blog-details/blog-details';
import { Hoardings } from './Services/hoardings/hoardings';
import { DigitalScreen } from './Services/digital-screen/digital-screen';
import { VehicleAds } from './Services/vehicle-ads/vehicle-ads';
import { PollKiosk } from './Services/poll-kiosk/poll-kiosk';
import { WallPainting } from './Services/wall-painting/wall-painting';
import { SignIn } from './pages/sign-in/sign-in';
import { SignUp } from './pages/sign-up/sign-up';
import { Dashboard } from './pages/dashboards/dashboard/dashboard';
import { AgencyDashboard } from './pages/dashboards/agency-dashboard/agency-dashboard';
import { ScreenOwnerDashboard } from './pages/dashboards/screen-owner-dashboard/screen-owner-dashboard';
import { GuestDashboard } from './pages/dashboards/guest-dashboard/guest-dashboard';
import { ScreenForm } from './Services Forms/screen-form/screen-form';
import { PollKisokForm } from './Services Forms/poll-kisok-form/poll-kisok-form';
import { VehicleAdsForm } from './Services Forms/vehicle-ads-form/vehicle-ads-form';
import { WallpaintsFrom } from './Services Forms/wallpaints-from/wallpaints-from';
import { HoardingFrom } from './Services Forms/hoarding-from/hoarding-from';
import { Services } from './pages/services/services';
import { DashboardOverview } from './Services/dashboard-overview/dashboard-overview';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { ScreenBoardDescript } from './pages/screen-board-descript/screen-board-descript';
import { ScreenBoardCardList } from './pages/screen-board-card-list/screen-board-card-list';
import { FeaturedList } from './pages/featured-list/featured-list';
import { Map3dView } from './pages/map3d-view/map3d-view';
import { InventoryMap } from './pages/inventory-map/inventory-map';


import { UsersList } from './pages/user-management/users-list/users-list';
import { AddUserForm } from './pages/user-management/add-user-form/add-user-form';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';

// 👇 New DashboardOverview component for default dashboard page


export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { path: 'signin', component: SignIn },
  { path: 'signup', component: SignUp },
  { path: 'home', component: Home },
  { path: 'ourWork', component: OurWork },
  { path: 'Blog', component: Blog },
  { path: 'blog-details/:id', component: BlogDetails },
  { path: 'contactUs', component: ContactUs },
  { path: 'Services', component: Services },
  { path: "auth/callback", component: AuthCallback },
  { path: "screenBoardCardList", component: ScreenBoardCardList },
  { path: "screenBoardDescrpt/:id/:service_type", component: ScreenBoardDescript },
  { path: 'featured/:type', component: FeaturedList },
  { path: 'map-3d/:lat/:lng', component: Map3dView },
  {
    path: 'inventory-map',
    component: InventoryMap,
    // Allow all authenticated users to view, but booking requires agency/admin role
  },
  { path: 'agency-dashboard', component: AgencyDashboard, canActivate: [authGuard], },
  { path: 'screen-owner-dashboard', component: ScreenOwnerDashboard, canActivate: [authGuard], },
  { path: 'guest-dashboard', component: GuestDashboard, canActivate: [authGuard], },


  // ✅ Dashboard Layout with children
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      // your charts & stats
      { path: 'hoarding', component: Hoardings },
      { path: 'overview', component: DashboardOverview },
      { path: 'digitalscreen', component: DigitalScreen },
      { path: 'vehicle-ads', component: VehicleAds },
      { path: 'poll-kiosk', component: PollKiosk },
      { path: 'wall-painting', component: WallPainting },
      { path: 'screen-Form/:id', component: ScreenForm },
      { path: 'poll-Kisok-Form/:id', component: PollKisokForm },
      { path: 'vehicle-Ads-Form/:id', component: VehicleAdsForm },
      { path: 'wall-Paints-Form/:id', component: WallpaintsFrom },
      { path: 'hoarding-form/:id', component: HoardingFrom },
      { path: 'users-list', component: UsersList },
      { path: 'users/add', component: AddUserForm },
      { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent) }

    ]
  },
  { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent) },

  // ✅ Forms (standalone)

];
