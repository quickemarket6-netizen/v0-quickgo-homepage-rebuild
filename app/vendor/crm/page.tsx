"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package, TrendingUp, Users, DollarSign, ShoppingCart,
  AlertTriangle, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Plus, Search, Filter, Download, RefreshCw, Eye, Edit, Trash2,
  Bell, Settings, Star, Clock, Truck, CheckCircle, XCircle,
  Zap, Target, Award, Sparkles, Brain, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

// Mock data
const STATS = {
  revenue: { value: 2450000, change: 12.5, period: 'ce mois' },
  orders: { value: 156, change: 8.3, period: 'cette semaine' },
  customers: { value: 89, change: 15.2, period: 'nouveaux' },
  avgCart: { value: 15700, change: -2.1, period: 'moyen' }
}

const PRODUCTS = [
  { id: 1, name: 'Riz Parfume 25kg', stock: 45, sold: 234, price: 18000, status: 'active', trend: 'up' },
  { id: 2, name: 'Huile Vegetale 5L', stock: 12, sold: 189, price: 8500, status: 'low_stock', trend: 'up' },
  { id: 3, name: 'Sucre en Poudre 10kg', stock: 0, sold: 156, price: 12000, status: 'out_of_stock', trend: 'down' },
  { id: 4, name: 'Lait en Poudre 400g', stock: 78, sold: 98, price: 3500, status: 'active', trend: 'stable' },
  { id: 5, name: 'Tomate Concentree 800g', stock: 5, sold: 145, price: 1800, status: 'low_stock', trend: 'up' },
]

const ORDERS = [
  { id: 'QG-2024-001', customer: 'Marie Nkolo', items: 3, total: 45000, status: 'pending', time: '10 min' },
  { id: 'QG-2024-002', customer: 'Paul Essomba', items: 1, total: 18000, status: 'preparing', time: '25 min' },
  { id: 'QG-2024-003', customer: 'Jean Mbarga', items: 5, total: 67500, status: 'ready', time: '45 min' },
  { id: 'QG-2024-004', customer: 'Claire Atangana', items: 2, total: 23000, status: 'delivered', time: '1h' },
]

const TOP_CUSTOMERS = [
  { name: 'Marie Nkolo', orders: 23, spent: 456000, lastOrder: '2 jours' },
  { name: 'Paul Essomba', orders: 18, spent: 312000, lastOrder: '1 semaine' },
  { name: 'Jean Mbarga', orders: 15, spent: 278000, lastOrder: '3 jours' },
  { name: 'Claire Atangana', orders: 12, spent: 198000, lastOrder: 'Aujourd\'hui' },
]

const AI_INSIGHTS = [
  { icon: '📈', text: 'Vos ventes de riz augmentent de 25% le weekend. Pensez a augmenter votre stock.', type: 'tip' },
  { icon: '⚠️', text: 'Stock critique: Sucre en Poudre 10kg est en rupture. 12 clients en attente.', type: 'alert' },
  { icon: '🎯', text: 'Marie Nkolo est votre meilleure cliente. Offrez-lui une reduction fidelite!', type: 'insight' },
  { icon: '💡', text: 'Les commandes sont 40% plus elevees entre 18h-20h. Optimisez votre disponibilite.', type: 'tip' },
]

export default function VendorCRMPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CM', { style: 'decimal' }).format(price) + ' FCFA'
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Actif', variant: 'default' },
      low_stock: { label: 'Stock bas', variant: 'secondary' },
      out_of_stock: { label: 'Rupture', variant: 'destructive' },
      pending: { label: 'En attente', variant: 'outline' },
      preparing: { label: 'Preparation', variant: 'secondary' },
      ready: { label: 'Pret', variant: 'default' },
      delivered: { label: 'Livre', variant: 'default' },
    }
    const { label, variant } = config[status] || { label: status, variant: 'outline' }
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">CRM Vendeur Premium</h1>
            <p className="text-muted-foreground">Gerez votre commerce intelligemment</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-lime-500 to-green-500 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* AI Insights Banner */}
        <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">QuickGo AI Business Assistant</h3>
                <p className="text-xs text-muted-foreground">Recommandations intelligentes pour votre commerce</p>
              </div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {AI_INSIGHTS.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex-shrink-0 p-3 rounded-xl border w-72 ${
                      insight.type === 'alert' ? 'bg-red-500/10 border-red-500/30' :
                      insight.type === 'tip' ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-green-500/10 border-green-500/30'
                    }`}
                  >
                    <span className="text-2xl mr-2">{insight.icon}</span>
                    <p className="text-sm">{insight.text}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Badge variant={STATS.revenue.change > 0 ? 'default' : 'destructive'} className="text-xs">
                  {STATS.revenue.change > 0 ? '+' : ''}{STATS.revenue.change}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{formatPrice(STATS.revenue.value)}</p>
              <p className="text-xs text-muted-foreground">Chiffre d&apos;affaires {STATS.revenue.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <Badge variant="default" className="text-xs">+{STATS.orders.change}%</Badge>
              </div>
              <p className="text-2xl font-bold">{STATS.orders.value}</p>
              <p className="text-xs text-muted-foreground">Commandes {STATS.orders.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <Badge variant="default" className="text-xs">+{STATS.customers.change}%</Badge>
              </div>
              <p className="text-2xl font-bold">{STATS.customers.value}</p>
              <p className="text-xs text-muted-foreground">Clients {STATS.customers.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-orange-500" />
                <Badge variant={STATS.avgCart.change > 0 ? 'default' : 'secondary'} className="text-xs">
                  {STATS.avgCart.change}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{formatPrice(STATS.avgCart.value)}</p>
              <p className="text-xs text-muted-foreground">Panier {STATS.avgCart.period}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Gestion des stocks</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Rechercher..." className="pl-9 w-48" />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PRODUCTS.map((product) => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{formatPrice(product.price)}</span>
                            <span>•</span>
                            <span>{product.sold} vendus</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{product.stock} unites</p>
                          <Progress 
                            value={Math.min(product.stock * 2, 100)} 
                            className={`w-20 h-2 ${product.stock === 0 ? '[&>div]:bg-red-500' : product.stock < 15 ? '[&>div]:bg-yellow-500' : ''}`}
                          />
                        </div>
                        {getStatusBadge(product.status)}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stock Alerts */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Stock bas (2)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PRODUCTS.filter(p => p.status === 'low_stock').map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span>{p.name}</span>
                        <Badge variant="secondary">{p.stock} restants</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Rupture de stock (1)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PRODUCTS.filter(p => p.status === 'out_of_stock').map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span>{p.name}</span>
                        <Button size="sm" variant="outline">Reapprovisionner</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Commandes recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ORDERS.map((order) => (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          order.status === 'pending' ? 'bg-yellow-500/10' :
                          order.status === 'preparing' ? 'bg-blue-500/10' :
                          order.status === 'ready' ? 'bg-green-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          {order.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                          {order.status === 'preparing' && <Package className="w-5 h-5 text-blue-500" />}
                          {order.status === 'ready' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {order.status === 'delivered' && <Truck className="w-5 h-5 text-gray-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.customer} • {order.items} articles</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground">Il y a {order.time}</p>
                        </div>
                        {getStatusBadge(order.status)}
                        <Button variant="outline" size="sm">Voir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Meilleurs clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TOP_CUSTOMERS.map((customer, i) => (
                    <div 
                      key={customer.name}
                      className="flex items-center justify-between p-4 rounded-xl border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          i === 0 ? 'bg-yellow-500/20' : i === 1 ? 'bg-gray-500/20' : i === 2 ? 'bg-orange-500/20' : 'bg-muted'
                        }`}>
                          {i < 3 ? (
                            <Award className={`w-5 h-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-500' : 'text-orange-500'}`} />
                          ) : (
                            <Users className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.orders} commandes • Derniere: {customer.lastOrder}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(customer.spent)}</p>
                          <p className="text-xs text-muted-foreground">Total depense</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contacter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Ventes par jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-2">
                    {[65, 45, 78, 52, 89, 95, 72].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-lime-500 to-green-500 rounded-t"
                          style={{ height: `${value}%` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Repartition des ventes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PRODUCTS.slice(0, 4).map((product, i) => {
                      const colors = ['bg-lime-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500']
                      const percent = [35, 28, 22, 15][i]
                      return (
                        <div key={product.id} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[i]}`} />
                          <span className="flex-1 text-sm">{product.name}</span>
                          <span className="font-medium">{percent}%</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
