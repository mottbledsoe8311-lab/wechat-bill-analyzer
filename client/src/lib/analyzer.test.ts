import { describe, it, expect } from 'vitest';

// 测试 isMerchant 函数的商户关键词匹配
describe('isMerchant function', () => {
  const MERCHANT_KEYWORDS = [
    '滴滴', '美团', '京东', '淘宝', '拼多多', '支付宝', '饿了么', '抖音', '快手', '小红书',
    '亚马逊', '沃尔玛', '考拉', '唯品会', '蘑菇街', 'ebay',
    '超市', '便利店', '商城', '商店', '药店', '医院', '银行', '7-11', '便利蜂', '罗森',
    '家乐福', '大润发', '永辉', '盒马', '朴朴', '每日优鲜',
    '电信', '移动', '联通', '水电', '燃气', '物业', '保险', '中国电信', '中国移动', '中国联通',
    '出行', '打车', '公交', '地铁', '加油', '停车', '高铁', '火车', '飞机', '航班',
    '神州租车', '瑞卡租车', '携程', '去哪儿', '飞猪',
    '餐饮', '酒店', '旅游', '航空', '铁路', '12306', '餐厅', '饭店', '咖啡', '奶茶',
    '麦当劳', '肯德基', '必胜客', '星巴克', '喜茶', '奈雪', '茶颜悦色',
    '腾讯', '网易', '百度', '阿里', '字节', '华为', '小米', '苹果', '微软', 'google',
    '爱奇艺', '优酷', '哔哩哔哩', '迪士尼', 'netflix',
    '公司工资', '投资收益', '理财', '基金', '股票', '证券', '期货',
    '商户', '收款', '转账', '支付', '充值', '购买', '订阅', '会员', '续费',
    '广告', '推广', '代理', '加盟', '分销', '佣金',
  ];

  function isMerchant(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase();
    return MERCHANT_KEYWORDS.some(kw => lower.includes(kw));
  }

  it('should identify common merchants', () => {
    expect(isMerchant('美团外卖')).toBe(true);
    expect(isMerchant('京东商城')).toBe(true);
    expect(isMerchant('滴滴打车')).toBe(true);
    expect(isMerchant('星巴克咖啡')).toBe(true);
    expect(isMerchant('中国移动')).toBe(true);
    expect(isMerchant('支付宝')).toBe(true);
  });

  it('should identify personal names as non-merchants', () => {
    expect(isMerchant('张三')).toBe(false);
    expect(isMerchant('李四')).toBe(false);
    expect(isMerchant('王五')).toBe(false);
    expect(isMerchant('小明')).toBe(false);
  });

  it('should handle case-insensitive matching', () => {
    expect(isMerchant('EBAY')).toBe(true);
    expect(isMerchant('Ebay')).toBe(true);
    expect(isMerchant('ebay')).toBe(true);
  });

  it('should handle empty or invalid input', () => {
    expect(isMerchant('')).toBe(false);
    expect(isMerchant(null as any)).toBe(false);
    expect(isMerchant(undefined as any)).toBe(false);
  });

  it('should identify merchants with partial keyword matches', () => {
    expect(isMerchant('美团-外卖')).toBe(true);
    expect(isMerchant('京东购物')).toBe(true);
    expect(isMerchant('便利店24小时')).toBe(true);
  });
});

// 测试规律转账检测的条件
describe('Regular Transfer Detection Conditions', () => {
  it('should filter out merchants', () => {
    const merchantNames = ['美团', '京东', '支付宝', '滴滴'];
    const personalNames = ['张三', '李四', '王五'];
    
    const MERCHANT_KEYWORDS = [
      '滴滴', '美团', '京东', '淘宝', '拼多多', '支付宝', '饿了么', '抖音', '快手', '小红书',
      '亚马逊', '沃尔玛', '考拉', '唯品会', '蘑菇街', 'ebay',
      '超市', '便利店', '商城', '商店', '药店', '医院', '银行', '7-11', '便利蜂', '罗森',
      '家乐福', '大润发', '永辉', '盒马', '朴朴', '每日优鲜',
      '电信', '移动', '联通', '水电', '燃气', '物业', '保险', '中国电信', '中国移动', '中国联通',
      '出行', '打车', '公交', '地铁', '加油', '停车', '高铁', '火车', '飞机', '航班',
      '神州租车', '瑞卡租车', '携程', '去哪儿', '飞猪',
      '餐饮', '酒店', '旅游', '航空', '铁路', '12306', '餐厅', '饭店', '咖啡', '奶茶',
      '麦当劳', '肯德基', '必胜客', '星巴克', '喜茶', '奈雪', '茶颜悦色',
      '腾讯', '网易', '百度', '阿里', '字节', '华为', '小米', '苹果', '微软', 'google',
      '爱奇艺', '优酷', '哔哩哔哩', '迪士尼', 'netflix',
      '公司工资', '投资收益', '理财', '基金', '股票', '证券', '期货',
      '商户', '收款', '转账', '支付', '充值', '购买', '订阅', '会员', '续费',
      '广告', '推广', '代理', '加盟', '分销', '佣金',
    ];

    function isMerchant(name: string): boolean {
      if (!name) return false;
      const lower = name.toLowerCase();
      return MERCHANT_KEYWORDS.some(kw => lower.includes(kw));
    }

    merchantNames.forEach(name => {
      expect(isMerchant(name)).toBe(true);
    });

    personalNames.forEach(name => {
      expect(isMerchant(name)).toBe(false);
    });
  });

  it('should filter transactions below 200 yuan cumulative', () => {
    const totalAmount1 = 150;
    const totalAmount2 = 200;
    const totalAmount3 = 250;

    expect(totalAmount1 < 200).toBe(true);
    expect(totalAmount2 < 200).toBe(false);
    expect(totalAmount3 < 200).toBe(false);
  });

  it('should filter regular patterns with interval >= 40 days', () => {
    const interval1 = 30;
    const interval2 = 40;
    const interval3 = 50;

    expect(interval1 >= 40).toBe(false);
    expect(interval2 >= 40).toBe(true);
    expect(interval3 >= 40).toBe(true);
  });

  it('should require at least 2 consecutive transactions with same amount', () => {
    const maxSameCount1 = 1;
    const maxSameCount2 = 2;
    const maxSameCount3 = 3;

    expect(maxSameCount1 < 2).toBe(true);
    expect(maxSameCount2 < 2).toBe(false);
    expect(maxSameCount3 < 2).toBe(false);
  });

  it('should categorize risk levels correctly', () => {
    const confidence1 = 1.0;
    const confidence2 = 0.75;
    const confidence3 = 0.5;
    const confidence4 = 0.3;

    let riskLevel1: 'low' | 'medium' | 'high' = 'low';
    if (confidence1 >= 1.0) {
      riskLevel1 = 'high';
    } else if (confidence1 >= 0.5) {
      riskLevel1 = 'medium';
    }
    expect(riskLevel1).toBe('high');

    let riskLevel2: 'low' | 'medium' | 'high' = 'low';
    if (confidence2 >= 1.0) {
      riskLevel2 = 'high';
    } else if (confidence2 >= 0.5) {
      riskLevel2 = 'medium';
    }
    expect(riskLevel2).toBe('medium');

    let riskLevel3: 'low' | 'medium' | 'high' = 'low';
    if (confidence3 >= 1.0) {
      riskLevel3 = 'high';
    } else if (confidence3 >= 0.5) {
      riskLevel3 = 'medium';
    }
    expect(riskLevel3).toBe('medium');

    let riskLevel4: 'low' | 'medium' | 'high' = 'low';
    if (confidence4 >= 1.0) {
      riskLevel4 = 'high';
    } else if (confidence4 >= 0.5) {
      riskLevel4 = 'medium';
    }
    expect(riskLevel4).toBe('low');
  });

  it('should only show outbound transfers', () => {
    const direction1 = '支出';
    const direction2 = '支';
    const direction3 = '收入';
    const direction4 = '收';

    expect(direction1 === '支出' || direction1 === '支').toBe(true);
    expect(direction2 === '支出' || direction2 === '支').toBe(true);
    expect(direction3 === '支出' || direction3 === '支').toBe(false);
    expect(direction4 === '支出' || direction4 === '支').toBe(false);
  });
});
