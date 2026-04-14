/**
 * 管理页面
 * 包含足迹关键词管理和规律转账疑似还款账户关键词管理
 * 需要登录才能访问
 */

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, MapPin, Users, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'wouter';
import { getLoginUrl } from '@/const';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  parking: { label: '停车场', color: 'bg-blue-100 text-blue-700' },
  property: { label: '物业/大厦', color: 'bg-green-100 text-green-700' },
  canteen: { label: '食堂/餐厅', color: 'bg-orange-100 text-orange-700' },
  exclude: { label: '排除词', color: 'bg-gray-100 text-gray-600' },
};

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();

  // 足迹关键词
  const [fpKeyword, setFpKeyword] = useState('');
  const [fpCategory, setFpCategory] = useState<'parking' | 'property' | 'canteen' | 'exclude'>('parking');
  const [fpDesc, setFpDesc] = useState('');

  // 规律转账关键词
  const [rpKeyword, setRpKeyword] = useState('');
  const [rpDesc, setRpDesc] = useState('');

  // tRPC 查询
  const fpQuery = trpc.footprintKeywords.getAll.useQuery(undefined, { enabled: isAuthenticated });
  const rpQuery = trpc.repaymentKeywords.getAll.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  // 足迹关键词操作
  const fpSave = trpc.footprintKeywords.save.useMutation({
    onSuccess: () => {
      toast.success('关键词已添加');
      setFpKeyword('');
      setFpDesc('');
      utils.footprintKeywords.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const fpDelete = trpc.footprintKeywords.delete.useMutation({
    onSuccess: () => {
      toast.success('已删除');
      utils.footprintKeywords.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // 规律转账关键词操作
  const rpSave = trpc.repaymentKeywords.save.useMutation({
    onSuccess: () => {
      toast.success('关键词已添加');
      setRpKeyword('');
      setRpDesc('');
      utils.repaymentKeywords.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rpDelete = trpc.repaymentKeywords.delete.useMutation({
    onSuccess: () => {
      toast.success('已删除');
      utils.repaymentKeywords.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">需要登录</h2>
        <p className="text-muted-foreground text-center">管理页面需要登录后才能访问</p>
        <Button onClick={() => window.location.href = getLoginUrl('/admin')}>
          登录
        </Button>
        <Link href="/">
          <Button variant="ghost" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </Link>
      </div>
    );
  }

  const fpKeywords = fpQuery.data?.data || [];
  const rpKeywords = rpQuery.data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Button>
            </Link>
            <span className="font-semibold text-base">关键词管理</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>{user?.name || '管理员'}</span>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl">
        <Tabs defaultValue="footprint">
          <TabsList className="mb-6">
            <TabsTrigger value="footprint" className="gap-2">
              <MapPin className="w-4 h-4" />
              足迹关键词
            </TabsTrigger>
            <TabsTrigger value="repayment" className="gap-2">
              <Users className="w-4 h-4" />
              疑似还款账户
            </TabsTrigger>
          </TabsList>

          {/* 足迹关键词管理 */}
          <TabsContent value="footprint">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    足迹识别关键词
                  </CardTitle>
                  <CardDescription>
                    添加停车场、物业、食堂等关键词，系统会根据这些关键词识别客户的足迹。
                    "排除词"用于过滤不相关的商户（如家附近的停车场）。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入关键词，如：国贸停车场"
                        value={fpKeyword}
                        onChange={(e) => setFpKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && fpKeyword.trim()) {
                            fpSave.mutate({ keyword: fpKeyword.trim(), category: fpCategory, description: fpDesc || undefined });
                          }
                        }}
                        className="flex-1"
                      />
                      <Select value={fpCategory} onValueChange={(v: any) => setFpCategory(v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parking">停车场</SelectItem>
                          <SelectItem value="property">物业/大厦</SelectItem>
                          <SelectItem value="canteen">食堂/餐厅</SelectItem>
                          <SelectItem value="exclude">排除词</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="备注（可选）"
                      value={fpDesc}
                      onChange={(e) => setFpDesc(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (!fpKeyword.trim()) return toast.error('请输入关键词');
                        fpSave.mutate({ keyword: fpKeyword.trim(), category: fpCategory, description: fpDesc || undefined });
                      }}
                      disabled={fpSave.isPending}
                      className="gap-1.5 self-start"
                    >
                      {fpSave.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      添加关键词
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 关键词列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    已添加关键词
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      共 {fpKeywords.length} 个
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fpQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : fpKeywords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      暂无关键词，请在上方添加
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* 按分类分组显示 */}
                      {(['parking', 'property', 'canteen', 'exclude'] as const).map(cat => {
                        const items = fpKeywords.filter((k: any) => k.category === cat);
                        if (items.length === 0) return null;
                        return (
                          <div key={cat} className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_LABELS[cat].color}`}>
                                {CATEGORY_LABELS[cat].label}
                              </span>
                              <span className="text-xs text-muted-foreground">{items.length} 个</span>
                            </div>
                            <div className="space-y-1.5">
                              {items.map((kw: any) => (
                                <div key={kw.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm">{kw.keyword}</span>
                                    {kw.description && (
                                      <span className="ml-2 text-xs text-muted-foreground">{kw.description}</span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fpDelete.mutate({ id: kw.id })}
                                    disabled={fpDelete.isPending}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 规律转账疑似还款账户关键词管理 */}
          <TabsContent value="repayment">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    疑似还款账户关键词
                  </CardTitle>
                  <CardDescription>
                    添加疑似还款账户的名称。当其他用户的账单中出现相同名称时，
                    系统会自动将其展示在"规律转账识别"模块中，不区分收入和支出方向。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <Input
                      placeholder="输入账户名称，如：张三"
                      value={rpKeyword}
                      onChange={(e) => setRpKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && rpKeyword.trim()) {
                          rpSave.mutate({ keyword: rpKeyword.trim(), description: rpDesc || undefined });
                        }
                      }}
                    />
                    <Input
                      placeholder="备注（可选，如：借款人、还款来源等）"
                      value={rpDesc}
                      onChange={(e) => setRpDesc(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (!rpKeyword.trim()) return toast.error('请输入账户名称');
                        rpSave.mutate({ keyword: rpKeyword.trim(), description: rpDesc || undefined });
                      }}
                      disabled={rpSave.isPending}
                      className="gap-1.5 self-start"
                    >
                      {rpSave.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      添加账户
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 账户列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    已添加账户
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      共 {rpKeywords.length} 个
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rpQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : rpKeywords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      暂无账户，请在上方添加
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {rpKeywords.map((kw: any) => (
                        <div key={kw.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm">{kw.keyword}</span>
                            {kw.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{kw.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              添加于 {new Date(kw.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => rpDelete.mutate({ id: kw.id })}
                            disabled={rpDelete.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
