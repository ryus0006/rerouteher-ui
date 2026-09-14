import { Navigate } from 'react-router-dom';
import App from './App.jsx';
import Landing from './routes/Landing.jsx';
import Background from './routes/diagnostic/Background.jsx';
import CareerBreak from './routes/diagnostic/CareerBreak.jsx';
import Priorities from './routes/diagnostic/Priorities.jsx';
import Snapshot from './routes/Snapshot.jsx';
import Gap from './routes/Gap.jsx';
import Journey from './routes/Journey.jsx';
import Learning from './routes/plan/Learning.jsx';
import EmployerFinder from './routes/plan/EmployerFinder.jsx';
import EmployerMatches from './routes/plan/EmployerMatches.jsx';
import Profile from './routes/Profile.jsx';

export const routes = [
  {
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'diagnostic/background', element: <Background /> },
      { path: 'diagnostic/break', element: <CareerBreak /> },
      { path: 'diagnostic/priorities', element: <Priorities /> },
      { path: 'diagnostic/snapshot', element: <Snapshot /> },
      { path: 'diagnostic/gap', element: <Gap /> },
      { path: 'journey', element: <Journey /> },
      { path: 'plan/learning', element: <Learning /> },
      { path: 'plan/employers', element: <EmployerFinder /> },
      { path: 'plan/employers/matches', element: <EmployerMatches /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
