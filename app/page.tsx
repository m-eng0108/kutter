'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Plus, ChevronRight, X, Star, CheckCircle2, 
  Image as ImageIcon, MapPin, Calendar, Trash2, Edit3, ChevronLeft, 
  Store, Utensils, JapaneseYen, MessageSquare, Heart, 
  Menu, Bell, Home, BarChart2, Bookmark, Map, TrendingUp, Award
} from 'lucide-react';

interface Ramen {
  id: string;
  shopName: string;
  ramenName: string;
  rating: number;
  price: number;
  genre: string;
  address: string;
  accessNote: string;
  date: string;
  visitCount: number;
  memo: string;
  wantAgain: boolean;
  images: string[];
}

export default function RamenApp() {
  const [ramenList, setRamenList] = useState<Ramen[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentTab, setCurrentTab] = useState<'home' | 'list' | 'stats'>('home');
  const [selectedGenre, setSelectedGenre] = useState('すべて');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedRamen, setSelectedRamen] = useState<Ramen | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // フォーム用ステート
  const [shopName, setShopName] = useState('');
  const [ramenName, setRamenName] = useState('');
  const [price, setPrice] = useState('');
  const [genre, setGenre] = useState('醤油');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState(5);
  const [memo, setMemo] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Supabaseからデータを取得
  const fetchRamens = async () => {
    try {
      const { data, error } = await supabase
        .from('ramens')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('データ取得エラー:', error);
      } else if (data) {
        // SupabaseのDBカラム名(スネークケース)をアプリの型(キャメルケース)に変換
        const formatted: Ramen[] = data.map((item: any) => ({
          id: item.id,
          shopName: item.shop_name,
          ramenName: item.ramen_name,
          rating: Number(item.rating),
          price: item.price,
          genre: item.genre,
          address: item.address,
          accessNote: item.access_note,
          date: item.date,
          visitCount: item.visit_count,
          memo: item.memo,
          wantAgain: item.want_again,
          images: item.images || [],
        }));
        setRamenList(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRamens();
  }, []);

  const startDate = new Date('2026-09-01');
  const today = new Date();
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const genres = ['すべて', '醤油', '塩', '味噌', '豚骨', 'その他'];

  // 画像自動圧縮・リサイズ処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

// ラーメン追加処理（Supabaseへ保存）
  const handleAddRamen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !ramenName) return;

    const newDbData = {
      id: Date.now().toString(),
      shop_name: shopName,
      ramen_name: ramenName,
      rating: rating,
      price: Number(price) || 0,
      genre: genre,
      address: address || '東京都新宿区',
      access_note: '駅チカ',
      date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
      visit_count: 1,
      memo: memo || '感想なし',
      want_again: true,
      images: [imagePreview || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80'],
    };

    try {
      console.log('保存データ送信中...', newDbData);
      const { data, error } = await supabase.from('ramens').insert([newDbData]).select();
      
      if (error) {
        console.error('Supabase保存エラー詳細:', error);
        alert('保存に失敗しました: ' + error.message);
        return;
      }

      console.log('保存成功！', data);

      // 成功したら一覧を再取得
      await fetchRamens();
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      
      setShopName('');
      setRamenName('');
      setPrice('');
      setGenre('醤油');
      setAddress('');
      setRating(5);
      setMemo('');
      setImagePreview(null);
    } catch (err) {
      console.error('予期せぬエラー:', err);
      alert('エラーが発生しました: ' + err);
    }
  };

  // 削除処理（Supabaseから削除）
  const handleDeleteRamen = async (id: string) => {
    if (confirm('この記録を削除しますか？')) {
      const { error } = await supabase.from('ramens').delete().eq('id', id);
      if (error) {
        alert('削除に失敗しました');
        return;
      }
      setRamenList(ramenList.filter((item) => item.id !== id));
      setSelectedRamen(null);
    }
  };

  const toggleWantAgain = async () => {
    if (!selectedRamen) return;
    const updated = { ...selectedRamen, wantAgain: !selectedRamen.wantAgain };
    setSelectedRamen(updated);
    setRamenList(ramenList.map(item => item.id === updated.id ? updated : item));

    await supabase
      .from('ramens')
      .update({ want_again: updated.wantAgain })
      .eq('id', updated.id);
  };

  if (loading) {
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 font-bold">読み込み中...</p>
    </div>
  }

  return (
    <div className="w-full max-w-md mx-auto bg-gray-50 min-h-screen pb-24 relative font-sans text-gray-800 shadow-xl overflow-x-hidden box-border">
      
      {/* 1. ラーメン詳細ページ */}
      {selectedRamen ? (
        <div className="bg-white min-h-screen pb-12 w-full box-border">
          <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 flex items-center justify-between px-4 py-3 border-b w-full box-border">
            <button onClick={() => setSelectedRamen(null)} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <img src="/logo.png" alt="Kutter Logo" className="h-8 object-contain" />
            <div className="flex items-center gap-3 text-xs font-bold">
              <button onClick={() => handleDeleteRamen(selectedRamen.id)} className="flex flex-col items-center text-red-500">
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </button>
            </div>
          </header>

          <div className="p-4 space-y-3 w-full box-border">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 shadow-sm w-full">
              <img
                src={selectedRamen.images[activeImageIndex] || selectedRamen.images[0]}
                alt={selectedRamen.shopName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {selectedRamen.date}
              </div>
              <div className="absolute top-3 right-3 bg-white/90 text-amber-500 text-sm font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                ★ {selectedRamen.rating.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-b w-full box-border">
            <div className="flex items-center gap-2 text-xl font-black text-gray-900">
              <Store className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <h2>{selectedRamen.shopName}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mt-1 pl-7">
              <Utensils className="w-4 h-4 text-blue-500" />
              <span>{selectedRamen.ramenName}</span>
            </div>
          </div>

          <div className="p-4 space-y-4 w-full box-border">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3.5 text-xs text-gray-700 border border-gray-100 w-full box-border">
              <div className="flex items-center">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> 食べた日</span>
                <span className="font-semibold text-gray-800">{selectedRamen.date}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5"><JapaneseYen className="w-4 h-4 text-blue-500" /> 価格</span>
                <span className="font-bold text-gray-800 text-sm">¥{selectedRamen.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5"><Utensils className="w-4 h-4 text-blue-500" /> ジャンル</span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md font-bold text-[11px]">{selectedRamen.genre}</span>
              </div>
              <div className="flex items-start">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5 pt-0.5"><MapPin className="w-4 h-4 text-blue-500" /> 所在地</span>
                <div className="flex-1 font-medium text-gray-800">
                  <p>{selectedRamen.address}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="w-24 text-gray-400 font-bold flex items-center gap-1.5 pt-0.5"><MessageSquare className="w-4 h-4 text-blue-500" /> 感想</span>
                <p className="flex-1 font-medium text-gray-700 bg-white p-2.5 rounded-xl border">{selectedRamen.memo}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border flex items-center justify-between shadow-sm w-full box-border">
              <div className="flex items-center gap-2 font-bold text-sm text-gray-800">
                <Heart className={`w-5 h-5 ${selectedRamen.wantAgain ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                <span>また食べたい！</span>
              </div>
              <button onClick={toggleWantAgain} className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${selectedRamen.wantAgain ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${selectedRamen.wantAgain ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

      ) : currentTab === 'list' ? (
        /* 2. 一覧タブ画面 */
        <div className="pb-16 w-full box-border">
          <header className="bg-[#007AFF] text-white w-full p-4 pt-10 sticky top-0 z-10 shadow-md flex items-center justify-center box-border">
            <img src="/logo.png" alt="Kutter Logo" className="h-10 object-contain" />
          </header>

          <div className="p-4 space-y-3 w-full box-border">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="店名・ラーメン名で検索" className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-sm border focus:outline-none box-border" />
              </div>
              <button className="flex items-center gap-1 bg-white px-3 py-2 rounded-full border text-xs text-blue-600 font-medium flex-shrink-0">
                <Filter className="w-4 h-4" /> 絞り込み
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs w-full">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${selectedGenre === g ? 'bg-blue-600 text-white font-bold' : 'bg-white text-gray-600 border'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 space-y-3 w-full box-border">
            {ramenList
              .filter(r => selectedGenre === 'すべて' || r.genre === selectedGenre)
              .map((ramen) => (
              <div
                key={ramen.id}
                onClick={() => { setSelectedRamen(ramen); setActiveImageIndex(0); }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border flex p-2 gap-3 items-center cursor-pointer w-full box-border"
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={ramen.images[0]} alt={ramen.shopName} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{ramen.date}</span>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-gray-800 text-base truncate">{ramen.shopName}</h3>
                  <p className="text-xs text-gray-500 truncate mb-1.5">{ramen.ramenName}</p>
                  <div className="flex items-center gap-3 text-xs mb-1.5">
                    <span className="text-amber-500 font-bold">★ {ramen.rating.toFixed(1)}</span>
                    <span className="text-gray-600">¥{ramen.price.toLocaleString()}</span>
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px]">{ramen.genre}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{ramen.address}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

      ) : currentTab === 'stats' ? (
        /* 4. 統計画面 */
        <div className="pb-16 w-full box-border">
          <header className="bg-[#007AFF] text-white px-4 pt-10 pb-4 shadow-md flex items-center justify-between w-full box-border">
            <div className="w-6" />
            <h1 className="font-bold text-base">統計データ</h1>
            <div className="w-6" />
          </header>

          <div className="p-4 space-y-4 w-full box-border">
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md space-y-3 w-full box-border">
              <div className="flex justify-between items-center">
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">通算記録サマリー</span>
                <TrendingUp className="w-5 h-5 text-white/80" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div>
                  <p className="text-[10px] text-blue-100 font-bold">総杯数</p>
                  <p className="text-xl font-black">🍜{ramenList.length}<span className="text-xs font-normal">杯</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-100 font-bold">訪問店舗</p>
                  <p className="text-xl font-black">📍{new Set(ramenList.map(r => r.shopName)).size}<span className="text-xs font-normal">店</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-100 font-bold">総支出</p>
                  <p className="text-base font-black pt-1">¥{ramenList.reduce((sum, r) => sum + r.price, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3 w-full box-border">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-blue-600" /> 月別ラーメン摂取量
                </h3>
                <span className="text-[10px] text-gray-400 font-bold">2026年</span>
              </div>
              
              <div className="space-y-2 pt-2">
                {[
                  { month: '9月 (今月)', count: ramenList.length, max: 25 },
                  { month: '8月', count: 14, max: 25 },
                  { month: '7月', count: 21, max: 25 },
                  { month: '6月', count: 16, max: 25 },
                  { month: '5月', count: 19, max: 25 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-bold text-gray-800">{item.count}杯</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.count / item.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3 w-full box-border">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> ジャンル別比率
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { name: '醤油', count: ramenList.filter(r => r.genre === '醤油').length, color: 'bg-blue-500' },
                  { name: '塩', count: ramenList.filter(r => r.genre === '塩').length, color: 'bg-teal-500' },
                  { name: '豚骨', count: ramenList.filter(r => r.genre === '豚骨').length, color: 'bg-amber-500' },
                  { name: '味噌', count: ramenList.filter(r => r.genre === '味噌').length, color: 'bg-orange-500' },
                  { name: 'その他', count: ramenList.filter(r => r.genre === 'その他').length, color: 'bg-purple-500' },
                ].map((g, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-none last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${g.color}`} />
                      <span className="font-bold text-gray-700">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-900 w-10 text-right">{g.count}杯</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      ) : (
        /* 3. 新ホーム画面 */
        <div className="pb-16 w-full box-border">
          <header className="bg-[#007AFF] text-white px-4 pt-10 pb-4 shadow-md flex items-center justify-between w-full box-border">
            <button className="p-1"><Menu className="w-6 h-6" /></button>
            <img src="/logo.png" alt="Kutter Logo" className="h-10 object-contain" />
            <button className="p-1"><Bell className="w-6 h-6" /></button>
          </header>

          <div className="px-4 mt-4 space-y-4 w-full box-border">
            
            {/* 統計カード上段 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border flex justify-between items-center w-full box-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  🍜
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-bold">累計ラーメン数</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">{ramenList.length}</span>
                    <span className="text-xs text-gray-600">杯</span>
                  </div>
                  <p className="text-[10px] text-blue-500 font-medium mt-0.5">記録をはじめて {diffDays}日</p>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-gray-100 flex-shrink-0" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  🍜
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 font-bold">今月のラーメン数</p>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-black text-gray-900">{ramenList.length}</span>
                    <span className="text-xs text-gray-600">杯</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">先月: 14杯</p>
                </div>
              </div>
            </div>

            {/* サマリー指標（2つ並び） */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-white p-3.5 rounded-2xl text-center border shadow-sm">
                <div className="w-8 h-8 mx-auto bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-1">★</div>
                <p className="text-[10px] text-gray-400 font-bold">平均評価</p>
                <p className="text-base font-black text-gray-800">
                  {ramenList.length > 0 ? (ramenList.reduce((sum, r) => sum + r.rating, 0) / ramenList.length).toFixed(1) : '0.0'}
                  <span className="text-[10px] text-amber-500">★</span>
                </p>
                <p className="text-[9px] text-gray-400">(5段階)</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl text-center border shadow-sm">
                <div className="w-8 h-8 mx-auto bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-1"><JapaneseYen className="w-4 h-4" /></div>
                <p className="text-[10px] text-gray-400 font-bold">使った金額</p>
                <p className="text-sm font-black text-gray-800">¥{ramenList.reduce((sum, r) => sum + r.price, 0).toLocaleString()}</p>
                <p className="text-[9px] text-gray-400">累計</p>
              </div>
            </div>

            {/* 大きな記録ボタン */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 text-base active:scale-[0.98] transition-all box-border"
            >
              <div className="bg-white/20 p-1 rounded-full"><Plus className="w-5 h-5" /></div>
              <span>食べたラーメンを記録する！</span>
            </button>

            {/* 最近食べたラーメンセクション */}
            <div className="space-y-2 w-full">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-sm text-gray-800">最近食べたラーメン</h3>
                <button onClick={() => setCurrentTab('list')} className="text-xs text-blue-600 font-bold flex items-center">
                  すべて見る <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {ramenList.slice(0, 3).map((ramen) => (
                  <div
                    key={ramen.id}
                    onClick={() => { setSelectedRamen(ramen); setActiveImageIndex(0); }}
                    className="bg-white rounded-2xl p-2 border shadow-sm cursor-pointer space-y-1.5 w-full overflow-hidden box-border"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 w-full">
                      <img src={ramen.images[0]} alt="" className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded">{ramen.date}</span>
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-xs truncate">{ramen.shopName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{ramen.ramenName}</p>
                      <div className="flex items-center gap-1 text-[11px] mt-1">
                        <span className="text-amber-500 font-bold">★ {ramen.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ジャンル別の食べた数 */}
            <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3 w-full box-border">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-800">ジャンル別の食べた数</h3>
                <span onClick={() => setCurrentTab('stats')} className="text-xs text-blue-600 font-bold flex items-center cursor-pointer">
                  すべて見る <ChevronRight className="w-4 h-4" />
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center w-full">
                <div>
                  <div className="text-lg">🍜</div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1">醤油</p>
                  <p className="text-xs font-black text-gray-900">{ramenList.filter(r => r.genre === '醤油').length}<span className="text-[9px]">杯</span></p>
                </div>
                <div>
                  <div className="text-lg">🥣</div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1">塩</p>
                  <p className="text-xs font-black text-gray-900">{ramenList.filter(r => r.genre === '塩').length}<span className="text-[9px]">杯</span></p>
                </div>
                <div>
                  <div className="text-lg">🍜</div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1">味噌</p>
                  <p className="text-xs font-black text-gray-900">{ramenList.filter(r => r.genre === '味噌').length}<span className="text-[9px]">杯</span></p>
                </div>
                <div>
                  <div className="text-lg">🍜</div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1">豚骨</p>
                  <p className="text-xs font-black text-gray-900">{ramenList.filter(r => r.genre === '豚骨').length}<span className="text-[9px]">杯</span></p>
                </div>
                <div>
                  <div className="text-lg">•••</div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1">その他</p>
                  <p className="text-xs font-black text-gray-900">{ramenList.filter(r => r.genre === 'その他').length}<span className="text-[9px]">杯</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ボトムナビゲーションバー */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around py-2 z-10 text-[10px] box-border">
        <button onClick={() => { setCurrentTab('home'); setSelectedRamen(null); }} className={`flex flex-col items-center gap-0.5 ${currentTab === 'home' && !selectedRamen ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
          <Home className="w-5 h-5" />
          <span>ホーム</span>
        </button>
        <button onClick={() => { setCurrentTab('list'); setSelectedRamen(null); }} className={`flex flex-col items-center gap-0.5 ${currentTab === 'list' && !selectedRamen ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
          <Utensils className="w-5 h-5" />
          <span>一覧</span>
        </button>
        <button onClick={() => { setCurrentTab('stats'); setSelectedRamen(null); }} className={`flex flex-col items-center gap-0.5 ${currentTab === 'stats' && !selectedRamen ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
          <BarChart2 className="w-5 h-5" />
          <span>統計</span>
        </button>
      </nav>

      {/* 登録用モーダル画面 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto box-border">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">ラーメンを記録</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddRamen} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ラーメンの写真</label>
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-medium">タップして写真を選択</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">店名</label>
                <input type="text" required placeholder="例：らぁ麺 はやし田" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm outline-none box-border" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ラーメン名</label>
                <input type="text" required placeholder="例：醤油らぁ麺" value={ramenName} onChange={(e) => setRamenName(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm outline-none box-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">価格 (円)</label>
                  <input type="number" placeholder="例：1200" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm outline-none box-border" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ジャンル</label>
                  <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none box-border">
                    {genres.filter(g => g !== 'すべて').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">所在地</label>
                <input type="text" placeholder="例：東京都新宿区" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm outline-none box-border" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">評価 (★ 1〜5)</label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button key={num} type="button" onClick={() => setRating(num)} className="p-1">
                      <Star className={`w-7 h-7 ${num <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">メモ・感想</label>
                <textarea placeholder="感想を入力" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full p-2 border rounded-lg text-sm h-14 resize-none outline-none box-border" />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow hover:bg-blue-700 transition-colors mt-2">
                保存する
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 完了モーダル */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-xl box-border">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800">記録が完了しました！🍜</h3>
              <p className="text-xs text-gray-500">新しいラーメンの記録がクラウドに追加されました。</p>
            </div>
            <button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl shadow text-sm">
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}