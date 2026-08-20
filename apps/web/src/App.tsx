import React from 'react';
import { AcademicCapIcon, ServerStackIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { APP_NAME, ROLE_LABELS } from '@suite/shared';
import { Button, Card } from '@suite/ui';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center">
              <AcademicCapIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
              <p className="text-sm text-gray-500">Mega proyecto educativo unificado</p>
            </div>
          </div>

          <Button>Fase 0 lista</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <ServerStackIcon className="h-10 w-10 text-blue-600 mb-3" />
            <h2 className="font-semibold text-gray-900 mb-1">Monorepo listo</h2>
            <p className="text-sm text-gray-500">
              Apps separadas para API y Web, con paquetes compartidos para base de datos, UI y lógica común.
            </p>
          </Card>

          <Card>
            <ShieldCheckIcon className="h-10 w-10 text-green-600 mb-3" />
            <h2 className="font-semibold text-gray-900 mb-1">Roles definidos</h2>
            <ul className="text-sm text-gray-500 space-y-1">
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <li key={key}>
                  <strong>{key}</strong>: {label}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <AcademicCapIcon className="h-10 w-10 text-purple-600 mb-3" />
            <h2 className="font-semibold text-gray-900 mb-1">Próxima fase</h2>
            <p className="text-sm text-gray-500">
              En la Fase 1 construiremos el layout, login, dashboard base y design system con Heroicons.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default App;