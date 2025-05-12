"use client";

import React, { Suspense } from 'react';
import { NavigationExample, DataDisplayExample, FormExample } from "@/components/examples";
// import { 
//   BlockchainExample,
//   FormExample 
// } from "@/components/examples";

export default function ComponentsShowcase() {
  return (
    <div className="space-y-12 py-8">
      <section>
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">Components Showcase</h1>
          
          {/* Navigation Components */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Navigation Components</h2>
            <div className="border rounded-lg p-4">
              <Suspense fallback={<div className="p-4">Loading...</div>}>
                <NavigationExample />
              </Suspense>
            </div>
          </div>

          {/* Form Components */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Form Components</h2>
            <div className="border rounded-lg p-4">
              <Suspense fallback={<div className="p-4">Loading...</div>}>
                <FormExample />
              </Suspense>
            </div>
          </div>

          {/* Data Display Components */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Data Display Components</h2>
            <div className="border rounded-lg p-4">
              <Suspense fallback={<div className="p-4">Loading...</div>}>
                <DataDisplayExample />
              </Suspense>
            </div>
          </div>

          {/* Blockchain Components */}
          {/* <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Blockchain Components</h2>
            <div className="border rounded-lg p-4">
              <Suspense fallback={<div className="p-4">Loading...</div>}>
                <BlockchainExample />
              </Suspense>
            </div>
          </div> */}
        </div>
      </section>
    </div>
  );
} 