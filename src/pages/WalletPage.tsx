import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Plus, ArrowUpRight, AlertCircle } from 'lucide-react';
import { supabase, Withdrawal, WithdrawalSetting } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge, getStatusColor, getStatusLabel } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

export function WalletPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<WithdrawalSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'bank_transfer'>('pix');
  const [pixKey, setPixKey] = useState('');
  const [bankData, setBankData] = useState({
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    account_holder_name: '',
    account_holder_document: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && (profile?.role === 'restaurant_owner' || profile?.role === 'delivery_partner')) {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    const [withdrawalsRes, settingsRes] = await Promise.all([
      supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('withdrawal_settings')
        .select('*')
        .eq('setting_name', profile!.role)
        .single(),
    ]);

    if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);

    setLoading(false);
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings || !profile) return;

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Valor inválido');
      return;
    }

    if (amount < settings.minimum_withdrawal) {
      alert(`Valor mínimo para saque: R$ ${settings.minimum_withdrawal.toFixed(2)}`);
      return;
    }

    if (amount > settings.maximum_withdrawal) {
      alert(`Valor máximo para saque: R$ ${settings.maximum_withdrawal.toFixed(2)}`);
      return;
    }

    if (amount > profile.balance) {
      alert('Saldo insuficiente');
      return;
    }

    setSubmitting(true);

    const totalFee = (amount * settings.withdrawal_fee_percent / 100) + settings.withdrawal_fee_fixed;
    const netAmount = amount - totalFee;

    const withdrawalData: any = {
      user_id: user!.id,
      amount,
      fee_percent: settings.withdrawal_fee_percent,
      fee_fixed: settings.withdrawal_fee_fixed,
      total_fee: totalFee,
      net_amount: netAmount,
      payment_method: paymentMethod,
    };

    if (paymentMethod === 'pix') {
      withdrawalData.pix_key = pixKey;
    } else {
      Object.assign(withdrawalData, bankData);
    }

    const { error } = await supabase.from('withdrawals').insert(withdrawalData);

    if (error) {
      alert('Erro ao solicitar saque');
      console.error(error);
    } else {
      await loadData();
      await refreshProfile();
      setShowWithdrawalForm(false);
      setWithdrawalAmount('');
      setPixKey('');
      setBankData({
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        account_holder_name: '',
        account_holder_document: '',
      });
    }

    setSubmitting(false);
  };

  if (!user || (profile?.role !== 'restaurant_owner' && profile?.role !== 'delivery_partner')) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Carteira</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Saldo Disponível</p>
                  <p className="text-3xl font-bold mt-1">R$ {profile?.balance.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="w-10 h-10 text-red-200" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Saques Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    R$ {withdrawals
                      .filter((w) => w.status === 'pending' || w.status === 'processing')
                      .reduce((sum, w) => sum + w.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Sacado</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    R$ {withdrawals
                      .filter((w) => w.status === 'completed')
                      .reduce((sum, w) => sum + w.net_amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {settings && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Informações de Saque</h3>
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p>Taxa: {settings.withdrawal_fee_percent}% + R$ {settings.withdrawal_fee_fixed.toFixed(2)}</p>
                    <p>Valor mínimo: R$ {settings.minimum_withdrawal.toFixed(2)}</p>
                    <p>Valor máximo: R$ {settings.maximum_withdrawal.toFixed(2)}</p>
                    <p>Prazo de processamento: {settings.processing_days} dias úteis</p>
                  </div>
                </div>
                <Button onClick={() => setShowWithdrawalForm(true)} disabled={!profile?.balance || profile.balance < settings.minimum_withdrawal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {showWithdrawalForm && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="font-bold text-gray-900">Nova Solicitação de Saque</h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <Input
                  label="Valor do Saque"
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder={`Mínimo: R$ ${settings?.minimum_withdrawal.toFixed(2)}`}
                  required
                />

                <Select
                  label="Forma de Recebimento"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  options={[
                    { value: 'pix', label: 'PIX' },
                    { value: 'bank_transfer', label: 'Transferência Bancária' },
                  ]}
                />

                {paymentMethod === 'pix' && (
                  <Input
                    label="Chave PIX"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CPF, email, telefone ou chave aleatória"
                    required
                  />
                )}

                {paymentMethod === 'bank_transfer' && (
                  <>
                    <Input
                      label="Banco"
                      value={bankData.bank_name}
                      onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                      placeholder="Nome do banco"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Agência"
                        value={bankData.bank_agency}
                        onChange={(e) => setBankData({ ...bankData, bank_agency: e.target.value })}
                        placeholder="0000"
                        required
                      />
                      <Input
                        label="Conta"
                        value={bankData.bank_account}
                        onChange={(e) => setBankData({ ...bankData, bank_account: e.target.value })}
                        placeholder="00000-0"
                        required
                      />
                    </div>
                    <Input
                      label="Nome do Titular"
                      value={bankData.account_holder_name}
                      onChange={(e) => setBankData({ ...bankData, account_holder_name: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                    <Input
                      label="CPF/CNPJ do Titular"
                      value={bankData.account_holder_document}
                      onChange={(e) => setBankData({ ...bankData, account_holder_document: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </>
                )}

                {withdrawalAmount && settings && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Valor solicitado</span>
                      <span>R$ {parseFloat(withdrawalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Taxa ({settings.withdrawal_fee_percent}% + R$ {settings.withdrawal_fee_fixed.toFixed(2)})</span>
                      <span>-R$ {((parseFloat(withdrawalAmount) * settings.withdrawal_fee_percent / 100) + settings.withdrawal_fee_fixed).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-600 pt-2 border-t border-gray-200">
                      <span>Você receberá</span>
                      <span>
                        R$ {(parseFloat(withdrawalAmount) - (parseFloat(withdrawalAmount) * settings.withdrawal_fee_percent / 100) - settings.withdrawal_fee_fixed).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowWithdrawalForm(false)}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" loading={submitting} fullWidth>
                    Solicitar Saque
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-900">Histórico de Saques</h3>
          </CardHeader>
          <CardBody>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum saque realizado ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          R$ {withdrawal.amount.toFixed(2)}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      {withdrawal.admin_notes && (
                        <p className="text-xs text-gray-500 mt-1">{withdrawal.admin_notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(withdrawal.status)}>
                        {getStatusLabel(withdrawal.status)}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Líquido: R$ {withdrawal.net_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
