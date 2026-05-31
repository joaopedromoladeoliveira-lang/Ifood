import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, Edit2, Save, AlertTriangle, TrendingDown, Percent } from 'lucide-react';
import { supabase, Withdrawal, WithdrawalSetting } from '../../lib/supabase';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge, getStatusColor, getStatusLabel } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface WithdrawalWithProfile extends Withdrawal {
  profiles?: {
    full_name: string;
    email: string;
    role: string;
    balance: number;
  };
}

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithProfile[]>([]);
  const [settings, setSettings] = useState<WithdrawalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all');
  const [editingSettings, setEditingSettings] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);

    const [withdrawalsRes, settingsRes] = await Promise.all([
      supabase
        .from('withdrawals')
        .select('*, profiles!withdrawals_user_id_fkey(full_name, email, role, balance)')
        .order('created_at', { ascending: false }),
      supabase.from('withdrawal_settings').select('*'),
    ]);

    if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);

    setLoading(false);
  };

  const handleUpdateStatus = async (withdrawalId: string, status: Withdrawal['status'], notes?: string) => {
    setSaving(true);

    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
    };

    if (notes) updateData.admin_notes = notes;

    await supabase.from('withdrawals').update(updateData).eq('id', withdrawalId);

    if (status === 'completed') {
      const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
      if (withdrawal && withdrawal.profiles) {
        const newBalance = withdrawal.profiles.balance - withdrawal.amount;
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('email', withdrawal.profiles.email);
      }
    }

    await loadData();
    setSaving(false);
  };

  const handleUpdateSettings = async (settingName: string, updates: Partial<WithdrawalSetting>) => {
    setSaving(true);
    await supabase
      .from('withdrawal_settings')
      .update(updates)
      .eq('setting_name', settingName);
    await loadData();
    setEditingSettings(null);
    setSaving(false);
  };

  const handleUpdateAmount = async (withdrawalId: string, newAmount: number) => {
    if (!newAmount || newAmount <= 0) {
      alert('Valor inválido');
      return;
    }

    setSaving(true);

    const setting = settings.find((s) => s.setting_name === 'restaurant_owner')!;
    const feePercent = setting.withdrawal_fee_percent;
    const feeFixed = setting.withdrawal_fee_fixed;
    const totalFee = (newAmount * feePercent / 100) + feeFixed;
    const netAmount = newAmount - totalFee;

    await supabase
      .from('withdrawals')
      .update({
        amount: newAmount,
        total_fee: totalFee,
        net_amount: netAmount,
      })
      .eq('id', withdrawalId);

    await loadData();
    setEditingAmount(null);
    setCustomAmount('');
    setSaving(false);
  };

  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter((w) => w.status === filter);

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Saques</h1>
                <p className="text-sm text-gray-500">Revise e processe solicitações de saque</p>
              </div>
            </div>

            {pendingCount > 0 && (
              <Badge variant="warning" className="text-base px-4 py-2">
                {pendingCount} solicitações pendentes
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-red-500" />
              Configurações de Taxas de Saque
            </h2>
            <p className="text-sm text-gray-500 mt-1">Edite as taxas que serão aplicadas aos saques</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.map((setting) => (
                <div key={setting.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {setting.setting_name.replace('_', ' ')}
                      </h3>
                    </div>
                    {editingSettings !== setting.setting_name ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSettings(setting.setting_name)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        loading={saving}
                        onClick={() => {
                          const inputs = document.querySelectorAll(`[data-setting="${setting.setting_name}"]`);
                          const updates: any = {};
                          inputs.forEach((input: any) => {
                            updates[input.name] = parseFloat(input.value) || 0;
                          });
                          handleUpdateSettings(setting.setting_name, updates);
                        }}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Salvar
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Taxa %</label>
                      {editingSettings === setting.setting_name ? (
                        <Input
                          type="number"
                          name="withdrawal_fee_percent"
                          data-setting={setting.setting_name}
                          defaultValue={setting.withdrawal_fee_percent}
                          step="0.1"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-red-500">{setting.withdrawal_fee_percent}%</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Taxa Fixa</label>
                      {editingSettings === setting.setting_name ? (
                        <Input
                          type="number"
                          name="withdrawal_fee_fixed"
                          data-setting={setting.setting_name}
                          defaultValue={setting.withdrawal_fee_fixed}
                          step="0.01"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">R$ {setting.withdrawal_fee_fixed.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Mínimo</label>
                      {editingSettings === setting.setting_name ? (
                        <Input
                          type="number"
                          name="minimum_withdrawal"
                          data-setting={setting.setting_name}
                          defaultValue={setting.minimum_withdrawal}
                          step="0.01"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">R$ {setting.minimum_withdrawal.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Máximo</label>
                      {editingSettings === setting.setting_name ? (
                        <Input
                          type="number"
                          name="maximum_withdrawal"
                          data-setting={setting.setting_name}
                          defaultValue={setting.maximum_withdrawal}
                          step="0.01"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">R$ {setting.maximum_withdrawal.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'all' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todos ({withdrawals.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full font-medium transition-all flex items-center ${
              filter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 mr-1" />
            Pendentes ({withdrawals.filter((w) => w.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'processing' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Processando
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'completed' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Concluídos
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Rejeitados
          </button>
        </div>

        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhum saque encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Valor Solicitado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Taxa</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Valor Líquido</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Saldo Atual</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{withdrawal.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500">{withdrawal.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info">
                            {withdrawal.profiles?.role === 'restaurant_owner' ? 'Restaurante' : 'Entregador'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {editingAmount === withdrawal.id && withdrawal.status === 'pending' ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder={withdrawal.amount.toString()}
                                className="w-32"
                              />
                              <Button
                                size="sm"
                                loading={saving}
                                onClick={() => handleUpdateAmount(withdrawal.id, parseFloat(customAmount))}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setEditingAmount(null);
                                  setCustomAmount('');
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">R$ {withdrawal.amount.toFixed(2)}</span>
                              {withdrawal.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setEditingAmount(withdrawal.id);
                                    setCustomAmount(withdrawal.amount.toString());
                                  }}
                                  className="ml-2 text-gray-400 hover:text-red-500"
                                  title="Editar valor"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{withdrawal.fee_percent}% + R$ {withdrawal.fee_fixed.toFixed(2)}</p>
                            <p className="text-gray-500 font-semibold">= R$ {withdrawal.total_fee.toFixed(2)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-green-600">R$ {withdrawal.net_amount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">R$ {withdrawal.profiles?.balance.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(withdrawal.status)}>
                            {getStatusLabel(withdrawal.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(withdrawal.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {withdrawal.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="success"
                                loading={saving}
                                onClick={() => handleUpdateStatus(withdrawal.id, 'completed')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={saving}
                                onClick={() => {
                                  const reason = prompt('Motivo da rejeição (opcional):');
                                  handleUpdateStatus(withdrawal.id, 'rejected', reason || undefined);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {withdrawal.status === 'processing' && (
                            <Button
                              size="sm"
                              variant="success"
                              loading={saving}
                              onClick={() => handleUpdateStatus(withdrawal.id, 'completed')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
              Completar
                            </Button>
                          )}
                          {withdrawal.admin_notes && (
                            <p className="text-xs text-gray-500 mt-1">{withdrawal.admin_notes}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
