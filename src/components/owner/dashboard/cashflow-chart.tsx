
"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CashflowChartProps {
  data: {
    date: string
    in: number
    out: number
  }[]
}

export function CashflowChart({ data }: CashflowChartProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Arus Kas (Cashflow)</CardTitle>
        <CardDescription>
          Perbandingan uang masuk dan keluar per hari
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`}
                />
                <Tooltip 
                    formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Amount"]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #eee' }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="in"
                    name="Uang Masuk"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 8 }}
                />
                <Line 
                    type="monotone" 
                    dataKey="out" 
                    name="Uang Keluar"
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
