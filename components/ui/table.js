import React from 'react';

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className="w-full caption-bottom text-sm"
      {...props}
    />
  </div>
));

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className="[&_tr]:border-b" {...props} />
));

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className="[&_tr:last-child]:border-0"
    {...props}
  />
));

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className="border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100"
    {...props}
  />
));

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
    {...props}
  />
));

export { Table, TableHeader, TableBody, TableRow, TableCell };