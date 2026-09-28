'use client';

import { Fragment } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
};

export default function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: SelectFieldProps) {
  const selectedOption = options.find(
    (option) => option.value === value,
  );

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-left text-sm text-white outline-none transition hover:border-cyan-400/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
            <span
              className={
                selectedOption
                  ? 'truncate text-white'
                  : 'text-slate-500'
              }
            >
              {selectedOption?.label ?? placeholder}
            </span>

            <ChevronDown
              size={18}
              className={`text-slate-400 transition ${
                open ? 'rotate-180 text-cyan-300' : ''
              }`}
            />
          </Listbox.Button>

          <Transition
            as={Fragment}
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition duration-75 ease-in"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900 p-1 shadow-2xl outline-none">
              {options.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm transition ${
                        active
                          ? 'bg-cyan-400/10 text-cyan-200'
                          : 'text-slate-300'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={
                            selected
                              ? 'truncate font-semibold text-cyan-300'
                              : 'truncate'
                          }
                        >
                          {option.label}
                        </span>

                        {selected && (
                          <Check
                            size={16}
                            className="ml-3 shrink-0 text-cyan-300"
                          />
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}