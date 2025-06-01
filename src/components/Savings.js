import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';  // dostosuj ścieżkę, jeśli inaczej masz strukturę
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Savings.css';

const Savings = () => {
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [productSavings, setProductSavings] = useState([]);
  const [autoAddedSavings, setAutoAddedSavings] = useState(0);
  const [monthlyComparison, setMonthlyComparison] = useState([]);

  useEffect(() => {
    // Przykładowe dane testowe - później podłączysz do API lub bazy
    setMonthlySavings(847.50);
    setProductSavings([
      { name: 'Lateksowe rękawiczki', saved: 123.00 },
      { name: 'Pasta wyciskowa', saved: 98.50 },
      { name: 'Igły', saved: 72.30 },
    ]);
    setAutoAddedSavings(230.20);
    setMonthlyComparison([
      { month: 'Kwiecień', expenses: 1350 },
      { month: 'Maj', expenses: 920 },
    ]);
  }, []);

  return (
    <div className="p-6 bg-white bg-opacity-80 shadow-lg rounded-2xl max-w-5xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">Oszczędności w gabinecie</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-green-50 border border-green-200 shadow-md">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-green-800">Oszczędności w tym miesiącu</h2>
            <p className="text-2xl font-bold text-green-700 mt-2">{monthlySavings.toFixed(2)} zł</p>
          </div>
        </Card>

        <Card className="bg-blue-50 border border-blue-200 shadow-md">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-blue-800">Zautomatyzowane oszczędności</h2>
            <p className="text-2xl font-bold text-blue-700 mt-2">{autoAddedSavings.toFixed(2)} zł</p>
          </div>
        </Card>

        <Card className="bg-purple-50 border border-purple-200 shadow-md">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-purple-800">Różnica miesiąc do miesiąca</h2>
            {monthlyComparison.length === 2 && (
              <p className="text-2xl font-bold text-purple-700 mt-2">
                {(monthlyComparison[0].expenses - monthlyComparison[1].expenses).toFixed(2)} zł
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Największe oszczędności per produkt</h3>
        <ul className="space-y-2">
          {productSavings.map((product, index) => (
            <li key={index} className="flex justify-between border-b pb-1 text-gray-800">
              <span>{product.name}</span>
              <span className="font-semibold">{product.saved.toFixed(2)} zł</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Wydatki miesięczne</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyComparison}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="expenses" fill="#660066" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Savings;
