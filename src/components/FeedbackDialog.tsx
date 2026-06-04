import { useState } from 'react';
import { Modal, TextArea, Input } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  recordId: string;
  onClose: () => void;
  onSubmit: (recordId: string, feedback: string, feedbackPerson: string) => Promise<void>;
}

export default function FeedbackDialog({ visible, recordId, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [person, setPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    if (!person.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(recordId, feedback.trim(), person.trim());
      setFeedback('');
      setPerson('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('feedback.title')}
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText={t('confirm')}
      cancelText={t('cancel')}
      okButtonProps={{ loading: submitting, disabled: !feedback.trim() || !person.trim() }}
      closeOnEsc
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextArea
          value={feedback}
          onChange={setFeedback}
          placeholder={t('feedback.placeholder')}
          rows={4}
          maxLength={1000}
        />
        <Input
          value={person}
          onChange={setPerson}
          placeholder={t('feedback.person.placeholder')}
        />
      </div>
    </Modal>
  );
}
