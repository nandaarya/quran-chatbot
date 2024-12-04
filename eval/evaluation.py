from nltk.translate.bleu_score import sentence_bleu
from rouge import Rouge
from sklearn.metrics import accuracy_score
from datasets import load_dataset

# Load dataset
dataset = load_dataset("emhaihsan/quran-indonesia-tafseer-translation", split="train")

# Inisialisasi metrik
bleu_scores, rouge_scores, em_scores = [], [], []
rouge = Rouge()

# Loop untuk evaluasi
for data in dataset:
    # Gabungkan instruction dan input
    instruction = data["instruction"]
    input_text_part = data["input"]
    ground_truth = data["output"]

    # Gabungkan instruction dan input sebagai input_text
    input_text = f"{instruction}\n{input_text_part}"

    # Inference dari model
    model_output = model.predict(input_text)  # Ubah sesuai metode inference model Anda

    # Hitung BLEU
    bleu_scores.append(sentence_bleu([ground_truth.split()], model_output.split()))

    # Hitung ROUGE
    rouge_result = rouge.get_scores(model_output, ground_truth)
    rouge_scores.append(rouge_result)

    # Hitung Exact Match
    em_scores.append(int(model_output.strip() == ground_truth.strip()))

# Rata-rata metrik
average_bleu = sum(bleu_scores) / len(bleu_scores)
average_em = sum(em_scores) / len(em_scores)

# ROUGE rata-rata dihitung terpisah karena formatnya lebih kompleks
average_rouge = {
    "rouge-1": sum([score[0]["rouge-1"]["f"] for score in rouge_scores]) / len(rouge_scores),
    "rouge-2": sum([score[0]["rouge-2"]["f"] for score in rouge_scores]) / len(rouge_scores),
    "rouge-l": sum([score[0]["rouge-l"]["f"] for score in rouge_scores]) / len(rouge_scores),
}

# Cetak hasil
print(f"Average BLEU: {average_bleu}")
print(f"Average Exact Match: {average_em}")
print("Average ROUGE:")
for key, value in average_rouge.items():
    print(f"  {key}: {value}")