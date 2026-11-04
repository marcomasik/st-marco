import { createBrowserRouter } from 'react-router';
import { MixDetailPage } from '../pages/MixDetailPage';
import { MixListPage } from '../pages/MixListPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AppLayout } from './AppLayout';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <MixListPage /> },
      { path: 'mix/:slug', element: <MixDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
