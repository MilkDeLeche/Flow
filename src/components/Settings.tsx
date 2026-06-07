import { LogOut, ShieldCheck } from 'lucide-react';
import ApiKeyPanel from './ApiKeyPanel';

interface SettingsProps {
  onKeyChange: () => void;
  onSignOut: () => void;
}

export default function Settings({ onKeyChange, onSignOut }: SettingsProps) {
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-10 md:px-8">
      <div className="mb-6">
        <h1 className="font-mondwest text-[32px] leading-none md:text-[42px]">
          Settings
        </h1>
        <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-[#646464]">
          Manage your API key and account session.
        </p>
      </div>

      <div className="space-y-6">
        <ApiKeyPanel onChange={onKeyChange} />

        <section className="rounded-2xl border-2 border-[#dee2de] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-medium text-[#2c2c2c]">
                <ShieldCheck size={16} />
                Account
              </h3>
              <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-[#646464]">
                Sign out when you are done studying on this device.
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
