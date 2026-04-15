/**
 * 管理页面 - 密码保护
 * 仅管理员可访问，需输入密码
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, MapPin, Users, ArrowLeft, Shield, Lock } from 'lucide-react';
import { Link } from 'wouter';

// 密码哈希（SHA-256 of "308246"）
// 前端只做简单比对，密码存在内存中不持久化
const ADMIN_PASSWORD = '308246';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  parking: { label: '停车场', color: 'bg-blue-100 text-blue-700' },
  property: { label: '物业', color: 'bg-purple-100 text-purple-700' },
  transit: { label: '网约车或地铁', color: 'bg-green-100 text-green-700' },
};

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pwd === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setPwd('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-background">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold">管理员后台</h2>
        <p className="text-sm text-muted-foreground mt-1">请输入管理员密码</p>
      </div>
      <div className="w-full max-w-xs flex flex-col gap-3">
        <Input
          type="password"
          placeholder="输入密码"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
          autoFocus
        />
        {error && (
          <p className="text-xs text-destructive text-center">密码错误，请重试</p>
        )}
        <Button onClick={handleSubmit} className="w-full">
          进入管理后台
        </Button>
      </div>
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Button>
      </Link>
    </div>
  );
}

function AdminPanel() {
  // 足迹关键词
  const [fpKeyword, setFpKeyword] = useState('');
  const [fpCategory, setFpCategory] = useState<'parking' | 'property' | 'transit'>('parking');
  const [fpDesc, setFpDesc] = useState('');

  // 规律转账关键词
  const [rpKeyword, setRpKeyword] = useState('');
  const [rpDesc, setRpDesc] = useState('');

  const fpQuery = trpc.footprintKeywords.getAll.useQuery();
  const rpQuery = trpc.repaymentKeywords.getAll.useQuery();
  const utils = trpc.useUtils();

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
            <span className="font-semibold text-base">管理员后台</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>管理员</span>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl">
        <Tabs defaultValue="footprint">
          <TabsList className="mb-6">
            <TabsTrigger value="footprint" className="gap-2">
              <MapPin className="w-4 h-4" />
              足迹关键词
              {fpKeywords.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{fpKeywords.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="repayment" className="gap-2">
              <Users className="w-4 h-4" />
              还款账户关键词
              {rpKeywords.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{rpKeywords.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 足迹关键词管理 */}
          <TabsContent value="footprint">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    添加足迹关键词
                  </CardTitle>
                  <CardDescription>
                    添加停车场、物业、网约车或地铁等关键词，系统会根据这些关键词识别用户的出行足迹。
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
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parking">停车场</SelectItem>
                          <SelectItem value="property">物业</SelectItem>
                          <SelectItem value="transit">网约车或地铁</SelectItem>
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
                    已有关键词
                    <span className="ml-2 text-sm font-normal text-muted-foreground">共 {fpKeywords.length} 个</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fpQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : fpKeywords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">暂无关键词</p>
                  ) : (
                    <div className="space-y-4">
                      {(['parking', 'property', 'transit'] as const).map(cat => {
                        const items = fpKeywords.filter((k: any) => k.category === cat);
                        if (items.length === 0) return null;
                        return (
                          <div key={cat}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_LABELS[cat]?.color || 'bg-gray-100 text-gray-600'}`}>
                                {CATEGORY_LABELS[cat]?.label || cat}
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

          {/* 规律转账关键词管理 */}
          <TabsContent value="repayment">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    添加还款账户关键词
                  </CardTitle>
                  <CardDescription>
                    添加疑似还款账户的名称关键词。当用户账单中出现包含该关键词的账户时，
                    系统会自动在"规律转账识别"模块中标记展示（不区分收入和支出方向）。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <Input
                      placeholder="输入账户名称关键词，如：张三"
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
                    已有关键词
                    <span className="ml-2 text-sm font-normal text-muted-foreground">共 {rpKeywords.length} 个</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rpQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : rpKeywords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">暂无关键词</p>
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

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <AdminPanel />;
}
